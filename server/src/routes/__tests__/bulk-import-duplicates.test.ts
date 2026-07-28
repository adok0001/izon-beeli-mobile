// --- Mocks (hoisted above imports by ts-jest) ---
//
// Regression guard for duplicate ids in one uploaded sheet. Before this, two
// rows sharing an id reached a single `INSERT … ON CONFLICT DO UPDATE`, which
// Postgres rejects with 21000 ("cannot affect row a second time"): the request
// 500'd with no row named, and because `inBatches` commits without a
// transaction, whatever had already been written stayed written. Duplicates
// split across a batch boundary didn't raise at all — one row silently
// overwrote the other.
//
// The dry-run path is what's exercised here: it runs the same mapping,
// validation and duplicate checks as a real import but returns before touching
// the database, so the guard can be tested without a live connection.

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
  return { db: { select: jest.fn(() => chainOf([])), insert: jest.fn(() => chainOf([])) } };
});

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn().mockResolvedValue({ sub: "clerk_1" }),
  createClerkClient: jest.fn(() => ({ users: { getUser: jest.fn() } })),
}));

import { db } from "../../db/index.js";
import { bulkImportRouter } from "../bulk-import.js";

/**
 * authMiddleware selects the user row, then reviewerMiddleware selects the role
 * flags. Both resolve through the same mocked `db.select`, so queue them in
 * call order.
 */
/** A thenable query-builder stub: every method chains, awaiting yields `result`. */
function chainOf(result: unknown[]): unknown {
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
}

function signedInAsAdmin() {
  const rows = [
    [{ id: "actor1", deletedAt: null }],
    [{ isAdmin: true, isReviewer: false, reviewerLanguages: [], reviewerRole: null }],
  ];
  let call = 0;
  (db.select as jest.Mock).mockImplementation(() => chainOf(rows[Math.min(call++, rows.length - 1)]));
}

type ImportResponse = {
  valid: number;
  errors: { id: string; reason: string }[];
};

async function dryRun(path: string, entries: Record<string, string>[]): Promise<ImportResponse> {
  signedInAsAdmin();
  const res = await bulkImportRouter.request(path, {
    method: "POST",
    headers: { Authorization: "Bearer tok", "Content-Type": "application/json" },
    body: JSON.stringify({ languageId: "izon", entries, dryRun: true }),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as ImportResponse;
}

const dictRow = (over: Record<string, string>) => ({
  type: "dictionary",
  text: "kọn",
  english: "take",
  category: "verbs",
  ...over,
});

describe("POST /import/unified — duplicate ids", () => {
  it("rejects the second of two rows sharing an explicit id, keeping the first", async () => {
    const body = await dryRun("/unified", [
      dictRow({ id: "izon-oru", text: "oru", english: "old" }),
      dictRow({ id: "izon-oru", text: "oru", english: "idol" }),
    ]);
    expect(body.valid).toBe(1);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].reason).toMatch(/Row 2: duplicate id "izon-oru" \(row 1 already uses it\)/);
  });

  it("rejects a repeated headword, since both rows synthesize the same id", async () => {
    const body = await dryRun("/unified", [
      dictRow({ text: "oru", english: "old" }),
      dictRow({ text: "oru", english: "idol" }),
    ]);
    expect(body.valid).toBe(1);
    expect(body.errors[0].reason).toMatch(/duplicate id/);
  });

  it("accepts words that differ only by diacritic — they are separate entries", async () => {
    const body = await dryRun("/unified", [
      dictRow({ text: "Keni", english: "one", category: "numbers" }),
      dictRow({ text: "kèní", english: "beg your pardon", category: "phrases" }),
      dictRow({ text: "Kẹnị", english: "one", category: "numbers" }),
    ]);
    expect(body.valid).toBe(3);
    expect(body.errors).toHaveLength(0);
  });

  it("leaves id-less non-dictionary rows alone — they get a uuid at insert time", async () => {
    const body = await dryRun("/unified", [
      { type: "proverb", text: "…", english: "A single hand…", meaning: "Cooperation." },
      { type: "proverb", text: "…", english: "A single hand…", meaning: "Cooperation." },
    ]);
    expect(body.valid).toBe(2);
    expect(body.errors).toHaveLength(0);
  });

  it("lets different content types share an id — they are different tables", async () => {
    const body = await dryRun("/unified", [
      dictRow({ id: "izon-oru", text: "oru", english: "old" }),
      { type: "proverb", id: "izon-oru", text: "…", english: "A single hand…", meaning: "Cooperation." },
    ]);
    expect(body.valid).toBe(2);
    expect(body.errors).toHaveLength(0);
  });

  it("reports the duplicate rather than failing the whole sheet", async () => {
    const body = await dryRun("/unified", [
      dictRow({ text: "oru", english: "old" }),
      dictRow({ text: "oru", english: "idol" }),
      dictRow({ text: "kọn", english: "take" }),
    ]);
    expect(body.valid).toBe(2);
    expect(body.errors).toHaveLength(1);
  });
});

describe("POST /import/unified — multiple senses of one word", () => {
  it("accepts semicolon-separated senses as a single entry", async () => {
    const body = await dryRun("/unified", [
      dictRow({ text: "oru", english: "old; ancient; former", category: "adjectives" }),
    ]);
    expect(body.valid).toBe(1);
    expect(body.errors).toHaveLength(0);
  });

  it("names the row when the gloss overflows the column instead of failing the batch", async () => {
    const body = await dryRun("/unified", [dictRow({ text: "oru", english: "old; ".repeat(120) })]);
    expect(body.valid).toBe(0);
    expect(body.errors[0].reason).toMatch(/english is 599 characters, over the 500 limit/); // trailing space trimmed
  });
});

describe("POST /import/:type — duplicate ids", () => {
  it("rejects a repeated explicit id on the per-type route too", async () => {
    const body = await dryRun("/dictionary", [
      { id: "izon-oru", word: "oru", english: "old", category: "adjectives" },
      { id: "izon-oru", word: "oru", english: "idol", category: "nouns" },
    ]);
    expect(body.valid).toBe(1);
    expect(body.errors[0].reason).toMatch(/duplicate id "izon-oru"/);
  });
});
