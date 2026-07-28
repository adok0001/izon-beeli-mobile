// End-to-end guards on POST /import/edit, at the level the route actually
// decides things: duplicate ids, unknown ids, and — the one that matters most —
// that an all-blank row never counts as changed and so never un-publishes.
//
// The db is faked rather than mocked away entirely: the handler's shape (SELECT,
// then merge, then write) is exactly what's under test.

const selected: Record<string, unknown>[] = [];
const executed: unknown[] = [];
const inserted: unknown[][] = [];

jest.mock("../../db/index.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(selected),
      }),
    }),
    execute: (query: unknown) => {
      executed.push(query);
      return Promise.resolve(selected.map((r) => ({ id: (r as { id: string }).id })));
    },
    insert: () => ({ values: (rows: unknown[]) => { inserted.push(rows); return Promise.resolve(); } }),
  },
}));

import { Hono } from "hono";
import { bulkEditRouter } from "../bulk-edit.js";

const ACTOR = "11111111-1111-1111-1111-111111111111";

// In production `authMiddleware` + `reviewerMiddleware` set these before the
// router runs, so the test app stands in for exactly that.
let actor = { isAdmin: true, reviewerLanguages: [] as string[] };
const app = new Hono();
app.use("*", async (c, next) => {
  c.set("isAdmin", actor.isAdmin);
  c.set("reviewerLanguages", actor.reviewerLanguages);
  c.set("userId", ACTOR);
  await next();
});
app.route("/", bulkEditRouter);

/** A stored row as `select()` would return it. */
function storedRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "d42",
    languageId: "izon",
    word: "kọn",
    english: "take",
    translations: { en: "take", fr: "prendre" },
    category: "verbs",
    pronunciation: null,
    example: null,
    exampleTranslation: null,
    exampleTranslations: null,
    semanticDomain: null,
    status: "published",
    publishedBy: ACTOR,
    publishedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

/** Drive the router with the auth context the middleware would have set. */
async function post(
  body: unknown,
  { isAdmin = true, reviewerLanguages = [] as string[] } = {},
) {
  actor = { isAdmin, reviewerLanguages };
  const res = await app.request("/edit", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  selected.length = 0;
  executed.length = 0;
  inserted.length = 0;
  actor = { isAdmin: true, reviewerLanguages: [] };
});

describe("POST /import/edit", () => {
  it("rejects a sheet that lists the same id twice, naming every row", async () => {
    const { status, body } = await post({
      languageId: "izon",
      entries: [{ id: "d42", english: "take" }, { id: "d42", english: "carry" }],
      dryRun: true,
    });
    expect(status).toBe(400);
    expect(body.error).toContain('"d42" (rows 1, 2)');
    expect(executed).toHaveLength(0);
  });

  it("reports an unknown id as an error and never inserts", async () => {
    selected.push(storedRow());
    const { body } = await post({
      languageId: "izon",
      entries: [{ id: "d42", english: "carry" }, { id: "nope", english: "x" }],
      dryRun: true,
    });
    expect(body.errors).toEqual([
      expect.objectContaining({
        id: "nope",
        reason: expect.stringContaining('no izon entry with id "nope"'),
      }),
    ]);
    expect(body.updated).toBe(1);
  });

  it("leaves the database untouched on a dry run", async () => {
    selected.push(storedRow());
    await post({ languageId: "izon", entries: [{ id: "d42", english: "carry" }], dryRun: true });
    expect(executed).toHaveLength(0);
    expect(inserted).toHaveLength(0);
  });

  // The single most important guard: a round-tripped export is mostly blank
  // cells, and treating those as edits would un-publish the whole sheet.
  it("counts an all-blank row as unchanged, writes nothing, and un-publishes nothing", async () => {
    selected.push(storedRow());
    const { body } = await post(
      {
        languageId: "izon",
        // Exactly what an unmodified export round-trips as.
        entries: [{ id: "d42", word: "", english: "", "english:fr": "", category: "", status: "published" }],
        dryRun: false,
      },
      { isAdmin: false, reviewerLanguages: ["izon"] },
    );
    expect(body).toMatchObject({ updated: 0, unchanged: 1, unpublished: 0 });
    expect(executed).toHaveLength(0);
    expect(inserted).toHaveLength(0);
  });

  it("counts an un-publish only for a reviewer editing a published row", async () => {
    selected.push(storedRow());
    const asReviewer = await post(
      { languageId: "izon", entries: [{ id: "d42", english: "carry" }], dryRun: true },
      { isAdmin: false, reviewerLanguages: ["izon"] },
    );
    expect(asReviewer.body.unpublished).toBe(1);
    expect(asReviewer.body.diff[0]).toMatchObject({ id: "d42", word: "kọn", unpublishes: true });

    const asAdmin = await post({ languageId: "izon", entries: [{ id: "d42", english: "carry" }], dryRun: true });
    expect(asAdmin.body.unpublished).toBe(0);
  });

  it("does not un-publish a row that was never published", async () => {
    selected.push(storedRow({ status: "draft", publishedBy: null, publishedAt: null }));
    const { body } = await post(
      { languageId: "izon", entries: [{ id: "d42", english: "carry" }], dryRun: true },
      { isAdmin: false, reviewerLanguages: ["izon"] },
    );
    expect(body.updated).toBe(1);
    expect(body.unpublished).toBe(0);
  });

  it("keeps a gloss the sheet had no column for", async () => {
    selected.push(storedRow());
    const { body } = await post({
      languageId: "izon",
      entries: [{ id: "d42", english: "carry" }], // no english:fr column at all
      dryRun: true,
    });
    const change = body.diff[0].changes.find((c: { field: string }) => c.field === "translations");
    expect(change.after).toBe('{"en":"carry","fr":"prendre"}');
  });

  it("refuses to clear a NOT NULL column", async () => {
    selected.push(storedRow());
    const { body } = await post({
      languageId: "izon",
      entries: [{ id: "d42", word: "--" }],
      dryRun: true,
    });
    expect(body.updated).toBe(0);
    expect(body.errors[0].reason).toContain("cannot be cleared");
  });

  it("rejects a category that isn't a Studio category", async () => {
    selected.push(storedRow());
    const { body } = await post({
      languageId: "izon",
      entries: [{ id: "d42", category: "adjektives" }],
      dryRun: true,
    });
    expect(body.errors[0].reason).toContain('invalid category "adjektives"');
  });

  it("writes an audit row per changed entry when it does run", async () => {
    selected.push(storedRow());
    const { body } = await post({ languageId: "izon", entries: [{ id: "d42", english: "carry" }], dryRun: false });
    expect(body.updated).toBe(1);
    expect(executed).toHaveLength(1);
    expect(inserted[0]).toEqual([
      expect.objectContaining({
        actorId: ACTOR,
        action: "edit",
        entityType: "dictionary_entries",
        entityId: "d42",
        before: expect.objectContaining({ english: "take" }),
        after: expect.objectContaining({ english: "carry" }),
      }),
    ]);
  });
});
