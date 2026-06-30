// --- Mocks (hoisted above imports by ts-jest) ---

jest.mock("../../db/index.js", () => {
  const chainOf = (result: unknown[]) => {
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const p = Promise.resolve(result);
            return (p[prop as "then"] as (...a: unknown[]) => unknown).bind(p);
          }
          return () => proxy;
        },
      }
    );
    return proxy;
  };
  // Round-trips whatever is passed to .values() so assertions on the inserted
  // row (e.g. that `english` was normalized) test real behavior, not a
  // hardcoded fixture.
  const makeInsertChain = () => {
    let inserted: Record<string, unknown> = {};
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "values") {
            return (v: Record<string, unknown>) => {
              inserted = v;
              return proxy;
            };
          }
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const p = Promise.resolve([{ id: "contrib1", ...inserted }]);
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
      select: jest.fn(() => chainOf([])),
      insert: jest.fn(() => makeInsertChain()),
      update: jest.fn(() => chainOf([])),
      delete: jest.fn(() => chainOf([])),
    },
    __chainOf: chainOf,
  };
});

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn().mockResolvedValue({ sub: "clerk_1" }),
  createClerkClient: jest.fn(() => ({ users: { getUser: jest.fn() } })),
}));

jest.mock("@vercel/blob", () => ({ put: jest.fn() }));

import { db } from "../../db/index.js";
import { contributionsRouter } from "../contributions.js";

const chainOf = (result: unknown[]) =>
  (jest.requireMock("../../db/index.js") as { __chainOf: (r: unknown[]) => unknown }).__chainOf(result);

/**
 * Queue successive return values for db.select() calls, in call order.
 * The route's POST / handler calls select() up to 3 times before insert:
 * (1) authMiddleware's user lookup, (2) existingDict check, (3) existingContrib
 * check — bounty lookup is a 4th, skipped here since tests don't set bountyId.
 * The last queued value repeats once exhausted.
 */
function queueSelects(...results: unknown[][]) {
  let callCount = 0;
  (db.select as jest.Mock).mockImplementation(() => {
    const result = results[Math.min(callCount, results.length - 1)];
    callCount += 1;
    return chainOf(result);
  });
}

function post(body: unknown) {
  return contributionsRouter.request("/", {
    method: "POST",
    headers: { Authorization: "Bearer tok", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const baseInput = {
  type: "word",
  languageId: "izon",
  word: "akpoo",
  category: "greetings",
};

const validUser = [{ id: "u1", deletedAt: null }];

beforeEach(() => {
  jest.clearAllMocks();
  // Default sequence for the happy path: a valid user, then no duplicates.
  queueSelects(validUser, [], []);
});

describe("POST /contributions — LocalizedText regression guard (commit 1f30804)", () => {
  // The server used to call .trim() on `english` outside its try/catch, so a
  // LocalizedText object ({en:"..."}) or its JSON-stringified form threw a
  // TypeError that Hono's onError masked as a generic 500.

  it("accepts english as a plain string (baseline)", async () => {
    const res = await post({ ...baseInput, english: "hello" });
    expect(res.status).toBe(201);
    expect(db.insert).toHaveBeenCalled();
  });

  it("normalizes english sent as a LocalizedText object instead of a string", async () => {
    const res = await post({ ...baseInput, english: { en: "hello", fr: "bonjour" } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.english).toBe("hello");
  });

  it("normalizes english sent as a JSON-stringified LocalizedText", async () => {
    const res = await post({ ...baseInput, english: JSON.stringify({ en: "hello" }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.english).toBe("hello");
  });

  it("normalizes exampleTranslation sent as a LocalizedText object", async () => {
    const res = await post({
      ...baseInput,
      english: "hello",
      exampleTranslation: { en: "a greeting" },
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.exampleTranslation).toBe("a greeting");
  });

  it("falls back to the first available value when 'en' is missing", async () => {
    const res = await post({ ...baseInput, english: { fr: "bonjour" } });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.english).toBe("bonjour");
  });
});

describe("POST /contributions — validation", () => {
  it("rejects a missing word with 400", async () => {
    const res = await post({ ...baseInput, word: "", english: "hello" });
    expect(res.status).toBe(400);
  });

  it("rejects a missing english with 400", async () => {
    const res = await post({ ...baseInput, english: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid type with 400", async () => {
    const res = await post({ ...baseInput, type: "not-a-real-type", english: "hello" });
    expect(res.status).toBe(400);
  });
});

describe("POST /contributions — duplicate detection", () => {
  it("returns 409 when the word already exists in the dictionary", async () => {
    queueSelects(validUser, [{ id: "existing1", word: "akpoo", english: "hello" }]);
    const res = await post({ ...baseInput, english: "hello" });
    expect(res.status).toBe(409);
  });

  it("returns 409 when a pending contribution for the word already exists", async () => {
    queueSelects(validUser, [], [{ id: "pending1", word: "akpoo", status: "submitted" }]);
    const res = await post({ ...baseInput, english: "hello" });
    expect(res.status).toBe(409);
  });
});
