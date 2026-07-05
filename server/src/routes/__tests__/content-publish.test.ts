// --- Mocks (hoisted above imports by ts-jest) ---
//
// Regression guard for the Beeli Studio four-eyes rule: a teacher-role
// reviewer must never be able to publish their own draft, while professors,
// elders, and admins can. Also covers language-scoping and the version/audit
// trail every publish is supposed to leave behind.

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

  const insertCalls: { table: unknown; values: Record<string, unknown> }[] = [];
  const makeInsertChain = (table: unknown) => {
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "values") {
            return (v: Record<string, unknown>) => {
              insertCalls.push({ table, values: v });
              return proxy;
            };
          }
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const p = Promise.resolve([]);
            return (p[prop as "then"] as (...a: unknown[]) => unknown).bind(p);
          }
          return () => proxy;
        },
      }
    );
    return proxy;
  };

  // Captures the .set() payload and resolves .returning() to a configurable row.
  let updateResult: unknown[] = [];
  let updateSetCall: Record<string, unknown> | undefined;
  const makeUpdateChain = () => {
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "set") {
            return (v: Record<string, unknown>) => {
              updateSetCall = v;
              return proxy;
            };
          }
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const p = Promise.resolve(updateResult);
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
      insert: jest.fn((table: unknown) => makeInsertChain(table)),
      update: jest.fn(() => makeUpdateChain()),
    },
    __chainOf: chainOf,
    __insertCalls: insertCalls,
    __resetInsertCalls: () => {
      insertCalls.length = 0;
    },
    __setUpdateResult: (rows: unknown[]) => {
      updateResult = rows;
    },
    __getUpdateSetCall: () => updateSetCall,
  };
});

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn().mockResolvedValue({ sub: "clerk_1" }),
  createClerkClient: jest.fn(() => ({ users: { getUser: jest.fn() } })),
}));

import { db } from "../../db/index.js";
import { contentPublishRouter } from "../content-publish.js";

type DbMock = typeof db & {
  __chainOf: (r: unknown[]) => unknown;
  __insertCalls: { table: unknown; values: Record<string, unknown> }[];
  __resetInsertCalls: () => void;
  __setUpdateResult: (rows: unknown[]) => void;
  __getUpdateSetCall: () => Record<string, unknown> | undefined;
};

const dbMock = jest.requireMock("../../db/index.js") as unknown as DbMock;

/** Queues successive db.select() results in call order (repeats the last once exhausted). */
function queueSelects(...results: unknown[][]) {
  let callCount = 0;
  (db.select as jest.Mock).mockImplementation(() => {
    const result = results[Math.min(callCount, results.length - 1)];
    callCount += 1;
    return dbMock.__chainOf(result);
  });
}

function publish(entityType: string, id: string) {
  return contentPublishRouter.request(`/${entityType}/${id}/publish`, {
    method: "POST",
    headers: { Authorization: "Bearer tok" },
  });
}

const ADMIN = { isAdmin: true, isReviewer: false, reviewerLanguages: [], reviewerRole: null };
const TEACHER_IZON = { isAdmin: false, isReviewer: true, reviewerLanguages: ["izon"], reviewerRole: "teacher" };
const PROFESSOR_IZON = { isAdmin: false, isReviewer: true, reviewerLanguages: ["izon"], reviewerRole: "professor" };
const ELDER_IZON = { isAdmin: false, isReviewer: true, reviewerLanguages: ["izon"], reviewerRole: "elder" };

const AUTH_USER = { id: "actor1", deletedAt: null };

function draftEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "d1",
    languageId: "izon",
    word: "akpoo",
    english: "hello",
    status: "draft",
    createdBy: "actor1",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  dbMock.__resetInsertCalls();
  dbMock.__setUpdateResult([{ id: "d1", status: "published" }]);
});

describe("POST /content/:entityType/:id/publish — four-eyes guard", () => {
  it("blocks a teacher-role reviewer from publishing their own draft", async () => {
    queueSelects([AUTH_USER], [TEACHER_IZON], [draftEntry({ createdBy: "actor1" })]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(403);
  });

  it("allows a professor to publish a teacher's draft", async () => {
    queueSelects([AUTH_USER], [PROFESSOR_IZON], [draftEntry({ createdBy: "someone-else" })], [{ maxVersion: 0 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);
  });

  it("allows an elder to publish a teacher's draft", async () => {
    queueSelects([AUTH_USER], [ELDER_IZON], [draftEntry({ createdBy: "someone-else" })], [{ maxVersion: 0 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);
  });

  it("allows an admin to publish anyone's draft, including their own", async () => {
    queueSelects([AUTH_USER], [ADMIN], [draftEntry({ createdBy: "actor1" })], [{ maxVersion: 0 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);
  });

  it("allows a professor to publish their own draft (four-eyes applies to teachers only)", async () => {
    queueSelects([AUTH_USER], [PROFESSOR_IZON], [draftEntry({ createdBy: "actor1" })], [{ maxVersion: 0 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);
  });
});

describe("POST /content/:entityType/:id/publish — language scoping", () => {
  it("blocks a reviewer not assigned to the entry's language", async () => {
    const reviewerOtherLang = { isAdmin: false, isReviewer: true, reviewerLanguages: ["yoruba"], reviewerRole: "professor" };
    queueSelects([AUTH_USER], [reviewerOtherLang], [draftEntry({ languageId: "izon" })]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(403);
  });
});

describe("POST /content/:entityType/:id/publish — versioning + audit trail", () => {
  it("writes a content_versions row and an audit_log row on successful publish", async () => {
    queueSelects([AUTH_USER], [ADMIN], [draftEntry()], [{ maxVersion: 2 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);

    const versionInsert = dbMock.__insertCalls.find((c) => c.values.entityType === "dictionary_entries" && "version" in c.values);
    expect(versionInsert?.values.version).toBe(3);
    expect(versionInsert?.values.createdBy).toBe("actor1");

    const auditInsert = dbMock.__insertCalls.find((c) => c.values.action === "publish");
    expect(auditInsert?.values.entityType).toBe("dictionary_entries");
    expect(auditInsert?.values.entityId).toBe("d1");
    expect(auditInsert?.values.actorId).toBe("actor1");
  });

  it("stamps status/publishedBy/publishedAt/updatedBy on the row update", async () => {
    queueSelects([AUTH_USER], [ADMIN], [draftEntry()], [{ maxVersion: 0 }]);
    const res = await publish("dictionary_entries", "d1");
    expect(res.status).toBe(200);

    const setCall = dbMock.__getUpdateSetCall();
    expect(setCall?.status).toBe("published");
    expect(setCall?.publishedBy).toBe("actor1");
    expect(setCall?.updatedBy).toBe("actor1");
    expect(setCall?.publishedAt).toBeInstanceOf(Date);
  });
});

describe("POST /content/:entityType/:id/publish — misc", () => {
  it("rejects an unknown entityType with 400", async () => {
    queueSelects([AUTH_USER], [ADMIN]);
    const res = await publish("not_a_real_entity", "d1");
    expect(res.status).toBe(400);
  });

  it("returns 404 when the row doesn't exist", async () => {
    queueSelects([AUTH_USER], [ADMIN], []);
    const res = await publish("dictionary_entries", "missing");
    expect(res.status).toBe(404);
  });

  it("resolves a lesson's language via its course before checking scope", async () => {
    const lessonRow = { id: "l1", courseId: "c1", status: "draft", createdBy: "actor1" };
    queueSelects(
      [AUTH_USER],
      [TEACHER_IZON],
      [lessonRow],
      [{ languageId: "izon" }], // course lookup
    );
    const res = await publish("lessons", "l1");
    // Same four-eyes rule applies once language scope resolves via the course join.
    expect(res.status).toBe(403);
  });
});

describe("POST /content/:entityType/:id/publish — Phase 3 entities", () => {
  it("resolves a story arc's language via its course, then applies four-eyes", async () => {
    const arcRow = { id: "story-arc-1", courseId: "c1", status: "draft", createdBy: "actor1" };
    queueSelects([AUTH_USER], [TEACHER_IZON], [arcRow], [{ languageId: "izon" }]);
    const res = await publish("story_arcs", "story-arc-1");
    expect(res.status).toBe(403);
  });

  it("lets a professor publish a teacher's story arc draft", async () => {
    const arcRow = { id: "story-arc-1", courseId: "c1", status: "draft", createdBy: "someone-else" };
    queueSelects([AUTH_USER], [PROFESSOR_IZON], [arcRow], [{ languageId: "izon" }], [{ maxVersion: 0 }]);
    const res = await publish("story_arcs", "story-arc-1");
    expect(res.status).toBe(200);
  });

  it("blocks a non-admin reviewer from publishing a content partner", async () => {
    queueSelects([AUTH_USER], [PROFESSOR_IZON]);
    const res = await publish("content_partners", "partner-1");
    expect(res.status).toBe(403);
  });

  it("lets an admin publish a content partner", async () => {
    queueSelects([AUTH_USER], [ADMIN], [{ id: "partner-1", status: "draft" }], [{ maxVersion: 0 }]);
    const res = await publish("content_partners", "partner-1");
    expect(res.status).toBe(200);
  });

  it("applies four-eyes to quiz questions (teacher can't publish own draft)", async () => {
    queueSelects([AUTH_USER], [TEACHER_IZON], [draftEntry({ id: "quiz-1", createdBy: "actor1" })]);
    const res = await publish("quiz_questions", "quiz-1");
    expect(res.status).toBe(403);
  });
});
