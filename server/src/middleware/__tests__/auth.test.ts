import { Hono } from "hono";

// --- Mocks (hoisted above imports by ts-jest) ---

// Configurable results for the chainable Drizzle query builder.
const mockState: { selectResult: unknown[]; insertResult: unknown[] } = {
  selectResult: [],
  insertResult: [],
};

jest.mock("../../db/index.js", () => {
  // A proxy that returns itself for any builder method (.from/.where/.limit/
  // .values/.onConflictDoUpdate/.returning) and resolves, when awaited, to the
  // configured result.
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
      select: jest.fn(() => makeChain(() => mockState.selectResult)),
      insert: jest.fn(() => makeChain(() => mockState.insertResult)),
    },
  };
});

jest.mock("@clerk/backend", () => {
  const getUser = jest.fn();
  return {
    __getUser: getUser,
    verifyToken: jest.fn(),
    createClerkClient: jest.fn(() => ({ users: { getUser } })),
  };
});

import * as clerk from "@clerk/backend";
import {
  authMiddleware,
  adminMiddleware,
  reviewerMiddleware,
  professorMiddleware,
  elderMiddleware,
  type AuthEnv,
} from "../auth.js";

const verifyToken = clerk.verifyToken as jest.Mock;
const getUser = (clerk as unknown as { __getUser: jest.Mock }).__getUser;

function makeApp() {
  const app = new Hono<AuthEnv>();
  app.use("*", authMiddleware);
  app.get("/me/profile", (c) => c.json({ userId: c.get("userId") }));
  app.get("/me/restore", (c) => c.json({ ok: true }));
  return app;
}

const bearer = { headers: { Authorization: "Bearer tok" } };

beforeEach(() => {
  jest.clearAllMocks();
  mockState.selectResult = [];
  mockState.insertResult = [];
  verifyToken.mockResolvedValue({ sub: "clerk_1" });
});

describe("authMiddleware", () => {
  it("rejects a missing Authorization header with 401", async () => {
    const res = await makeApp().request("/me/profile");
    expect(res.status).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("rejects a non-Bearer header with 401", async () => {
    const res = await makeApp().request("/me/profile", {
      headers: { Authorization: "Basic abc" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid/expired token with 401", async () => {
    verifyToken.mockRejectedValue(new Error("bad token"));
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(401);
  });

  it("rejects a token without a subject with 401", async () => {
    verifyToken.mockResolvedValue({ sub: undefined });
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(401);
  });

  // The core regression guard for the perf fix: an existing user must NOT
  // trigger a Clerk API round-trip.
  it("does NOT call Clerk when the user row already exists", async () => {
    mockState.selectResult = [{ id: "u1", deletedAt: null }];
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u1" });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("calls Clerk exactly once for a first-seen user and creates the row", async () => {
    mockState.selectResult = []; // no existing row
    mockState.insertResult = [{ id: "u2", deletedAt: null }];
    getUser.mockResolvedValue({
      id: "clerk_1",
      username: "ada",
      primaryEmailAddress: { emailAddress: "ada@example.com" },
    });
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u2" });
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it("blocks a soft-deleted account within the grace window with 403", async () => {
    mockState.selectResult = [
      { id: "u3", deletedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ];
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("account_scheduled_for_deletion");
  });

  it("allows the restore endpoint through for a soft-deleted account", async () => {
    mockState.selectResult = [
      { id: "u3", deletedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    ];
    const res = await makeApp().request("/me/restore", bearer);
    expect(res.status).toBe(200);
  });

  it("returns 404 once the 30-day grace window has elapsed", async () => {
    mockState.selectResult = [
      { id: "u3", deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    ];
    const res = await makeApp().request("/me/profile", bearer);
    expect(res.status).toBe(404);
  });
});

function makeRoleApp(
  mw: typeof adminMiddleware
): Hono<AuthEnv> {
  const app = new Hono<AuthEnv>();
  app.use("*", authMiddleware);
  app.use("*", mw);
  app.get("/x", (c) => c.json({ ok: true }));
  return app;
}

describe("role middlewares", () => {
  it("adminMiddleware allows isAdmin and rejects others", async () => {
    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: true }];
    expect((await makeRoleApp(adminMiddleware).request("/x", bearer)).status).toBe(200);

    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: false }];
    expect((await makeRoleApp(adminMiddleware).request("/x", bearer)).status).toBe(403);
  });

  it("reviewerMiddleware allows admins or reviewers, rejects neither", async () => {
    mockState.selectResult = [
      { id: "u1", deletedAt: null, isAdmin: false, isReviewer: true, reviewerLanguages: ["izon"], reviewerRole: null },
    ];
    expect((await makeRoleApp(reviewerMiddleware).request("/x", bearer)).status).toBe(200);

    mockState.selectResult = [
      { id: "u1", deletedAt: null, isAdmin: false, isReviewer: false, reviewerLanguages: [], reviewerRole: null },
    ];
    expect((await makeRoleApp(reviewerMiddleware).request("/x", bearer)).status).toBe(403);
  });

  it("professorMiddleware allows professor/elder/admin, rejects students", async () => {
    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: false, reviewerRole: "professor" }];
    expect((await makeRoleApp(professorMiddleware).request("/x", bearer)).status).toBe(200);

    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: false, reviewerRole: null }];
    expect((await makeRoleApp(professorMiddleware).request("/x", bearer)).status).toBe(403);
  });

  it("elderMiddleware allows only elders/admins", async () => {
    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: false, reviewerRole: "elder" }];
    expect((await makeRoleApp(elderMiddleware).request("/x", bearer)).status).toBe(200);

    mockState.selectResult = [{ id: "u1", deletedAt: null, isAdmin: false, reviewerRole: "professor" }];
    expect((await makeRoleApp(elderMiddleware).request("/x", bearer)).status).toBe(403);
  });
});
