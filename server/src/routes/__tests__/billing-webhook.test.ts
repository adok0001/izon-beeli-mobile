// --- Mocks (hoisted above imports by ts-jest) ---

const mockDb: { insertResult: unknown[]; updateResult: unknown[]; selectResult: unknown[] } = {
  insertResult: [{ id: "org1" }],
  updateResult: [],
  selectResult: [],
};

jest.mock("../../db/index.js", () => {
  const makeChain = (getResult: () => unknown[]) => {
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const p = Promise.resolve(getResult());
            return (p[prop as "then"] as (...a: unknown[]) => unknown).bind(p);
          }
          return () => proxy;
        },
      }
    );
    return proxy;
  };
  return {
    db: {
      insert: jest.fn(() => makeChain(() => mockDb.insertResult)),
      update: jest.fn(() => makeChain(() => mockDb.updateResult)),
      select: jest.fn(() => makeChain(() => mockDb.selectResult)),
    },
  };
});

// auth.ts (imported transitively via billing.ts) must not hit the network.
jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn(),
  createClerkClient: jest.fn(() => ({ users: { getUser: jest.fn() } })),
}));

jest.mock("stripe", () => {
  const constructEvent = jest.fn();
  const retrieve = jest.fn();
  const ctor = jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve },
  }));
  (ctor as unknown as { __constructEvent: jest.Mock }).__constructEvent = constructEvent;
  (ctor as unknown as { __retrieve: jest.Mock }).__retrieve = retrieve;
  return { __esModule: true, default: ctor };
});

import Stripe from "stripe";
import { db } from "../../db/index.js";
import { billingWebhookRouter } from "../billing.js";

const constructEvent = (Stripe as unknown as { __constructEvent: jest.Mock }).__constructEvent;
const retrieve = (Stripe as unknown as { __retrieve: jest.Mock }).__retrieve;

function post(headers: Record<string, string> = { "stripe-signature": "sig" }) {
  return billingWebhookRouter.request("/webhooks", {
    method: "POST",
    headers,
    body: "{}",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDb.insertResult = [{ id: "org1" }];
});

describe("Stripe webhook", () => {
  it("returns 400 when the signature header is missing", async () => {
    const res = await post({});
    expect(res.status).toBe(400);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("returns 400 when signature verification fails", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const res = await post();
    expect(res.status).toBe(400);
  });

  it("provisions org + subscription on checkout.session.completed", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          customer: "cus_1",
          subscription: "sub_1",
          metadata: { userId: "u1", orgName: "Acme", priceId: "price_starter" },
        },
      },
    });
    retrieve.mockResolvedValue({ current_period_end: 1_700_000_000 });

    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    expect(db.insert).toHaveBeenCalled(); // org + subscription
    expect(db.update).toHaveBeenCalled(); // user.organizationId
  });

  it("skips silently when checkout metadata is missing", async () => {
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { mode: "subscription", metadata: {} } },
    });
    const res = await post();
    expect(res.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("marks the subscription canceled on customer.subscription.deleted", async () => {
    constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1" } },
    });
    const res = await post();
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });

  it("marks the subscription past_due on invoice.payment_failed", async () => {
    constructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { subscription: "sub_1" } },
    });
    const res = await post();
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
  });
});
