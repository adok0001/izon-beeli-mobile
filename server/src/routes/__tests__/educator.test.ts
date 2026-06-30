// --- Mocks (hoisted above imports by ts-jest) ---
//
// Regression guard for the reviewerLanguages scoping in educatorRouter, kept
// in place ahead of the educator.ts route split (god-file -> per-resource
// sub-routers): admins must see every language, reviewers only their own.

import { Hono } from "hono";
import { users, languages } from "../../db/schema.js";

jest.mock("../../db/index.js", () => {
  const state: { users: unknown[]; languages: unknown[] } = {
    users: [],
    languages: [],
  };
  const makeChain = (table: unknown) => {
    const proxy: unknown = new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "from") {
            return (t: unknown) => makeChain(t);
          }
          if (prop === "then" || prop === "catch" || prop === "finally") {
            const result = table === languages ? state.languages : state.users;
            const p = Promise.resolve(result);
            return (p[prop as "then"] as (...a: unknown[]) => unknown).bind(p);
          }
          return () => proxy;
        },
      }
    );
    return proxy;
  };
  return {
    db: { select: jest.fn(() => makeChain(undefined)) },
    __state: state,
  };
});

jest.mock("@clerk/backend", () => ({
  verifyToken: jest.fn().mockResolvedValue({ sub: "clerk_1" }),
  createClerkClient: jest.fn(() => ({ users: { getUser: jest.fn() } })),
}));

import { educatorRouter } from "../educator.js";

const mockState = (
  jest.requireMock("../../db/index.js") as {
    __state: { users: unknown[]; languages: unknown[] };
  }
).__state;

function makeApp() {
  const app = new Hono();
  app.route("/educator", educatorRouter);
  return app;
}

function getMe() {
  return makeApp().request("/educator/me", {
    headers: { Authorization: "Bearer tok" },
  });
}

const ALL_LANGUAGES = [
  { id: "izon", name: "Izon", nativeName: "Izọn", region: "Niger Delta" },
  { id: "igbo", name: "Igbo", nativeName: "Igbo", region: "South East" },
  { id: "yoruba", name: "Yoruba", nativeName: "Yorùbá", region: "South West" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockState.languages = ALL_LANGUAGES;
});

describe("GET /educator/me — reviewerLanguages scoping", () => {
  it("returns every language for an admin", async () => {
    mockState.users = [
      {
        id: "u1",
        deletedAt: null,
        name: "Admin",
        email: "admin@example.com",
        isAdmin: true,
        isReviewer: false,
        reviewerLanguages: [],
        reviewerRole: null,
      },
    ];

    const res = await getMe();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.languages.map((l: { id: string }) => l.id).sort()).toEqual(
      ["igbo", "izon", "yoruba"]
    );
  });

  it("scopes a non-admin reviewer to only their reviewerLanguages", async () => {
    mockState.users = [
      {
        id: "u2",
        deletedAt: null,
        name: "Reviewer",
        email: "reviewer@example.com",
        isAdmin: false,
        isReviewer: true,
        reviewerLanguages: ["izon"],
        reviewerRole: null,
      },
    ];

    const res = await getMe();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.languages.map((l: { id: string }) => l.id)).toEqual(["izon"]);
  });

  it("never leaks a language outside the reviewer's scope, even with multiple assigned", async () => {
    mockState.users = [
      {
        id: "u3",
        deletedAt: null,
        name: "Reviewer",
        email: "reviewer2@example.com",
        isAdmin: false,
        isReviewer: true,
        reviewerLanguages: ["izon", "igbo"],
        reviewerRole: null,
      },
    ];

    const res = await getMe();
    const body = await res.json();
    const ids: string[] = body.languages.map((l: { id: string }) => l.id);
    expect(ids.sort()).toEqual(["igbo", "izon"]);
    expect(ids).not.toContain("yoruba");
  });

  it("rejects a user who is neither admin nor reviewer with 403", async () => {
    mockState.users = [
      {
        id: "u4",
        deletedAt: null,
        name: "Student",
        email: "student@example.com",
        isAdmin: false,
        isReviewer: false,
        reviewerLanguages: [],
        reviewerRole: null,
      },
    ];

    const res = await getMe();
    expect(res.status).toBe(403);
  });
});
