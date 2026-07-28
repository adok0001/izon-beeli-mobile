import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { headwordId, slugify } from "../slug.js";

/**
 * `headwordId` is what makes a dictionary CSV re-import idempotent, and it is
 * implemented twice — the Studio panel synthesizes ids in the browser before
 * POSTing, and the server synthesizes them for the unified sheet. The two must
 * agree exactly: a drift means the same word gets two ids and one entry becomes
 * two rows, which is precisely the failure this id scheme exists to prevent.
 *
 * The API deploys from `server/` alone and cannot import from `web/`, so the
 * parity test loads the web source from disk (dev/CI only, never at runtime) and
 * runs both implementations over the same words.
 */
const WEB_PARSE_CSV = join(__dirname, "../../../../web/lib/parse-csv.ts");

function loadWebHeadwordId(): (languageId: string, word: string) => string {
  const { outputText } = ts.transpileModule(readFileSync(WEB_PARSE_CSV, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  });
  // parse-csv.ts re-exports `parseCsv` from `@mobile/lib/unified-import` (a
  // webpack/tsconfig path alias, not a real Node module) — that `require` call
  // executes unconditionally on load even though `headwordId` never touches
  // `parseCsv`, so a no-op stub is enough to let the module evaluate here.
  const load = new Function(
    "exports", "require", "lang", "word",
    `${outputText}\nreturn exports.headwordId(lang, word);`,
  );
  return (languageId, word) => load({}, () => ({}), languageId, word) as string;
}

/** Real Izon headwords that collapse to one slug — the case that motivated this. */
const COLLAPSING = ["Keni", "kèní", "Kẹnị", "keni", "Angọ", "ango", "Kụọ", "kụ́ọ", "dị", "Di"];

describe("slugify", () => {
  it("folds diacritics and case, which is why it cannot be an identity", () => {
    expect(slugify("Kẹnị")).toBe(slugify("kèní"));
  });
});

describe("headwordId", () => {
  it("keeps the readable slug as a stem", () => {
    expect(headwordId("izon", "kọn")).toMatch(/^izon-kon-[0-9a-z]+$/);
  });

  it("gives every distinct headword a distinct id", () => {
    const ids = COLLAPSING.map((w) => headwordId("izon", w));
    expect(new Set(ids).size).toBe(COLLAPSING.length);
  });

  it("is stable across calls, so a re-import upserts", () => {
    expect(headwordId("izon", "kọn")).toBe(headwordId("izon", "kọn"));
  });

  it("ignores Unicode normalization form", () => {
    expect(headwordId("izon", "kọn".normalize("NFC"))).toBe(headwordId("izon", "kọn".normalize("NFD")));
  });

  it("scopes ids by language", () => {
    expect(headwordId("izon", "kọn")).not.toBe(headwordId("igbo", "kọn"));
  });

  it("stays inside the varchar(64) id column, even for a long headword", () => {
    const long = "ọ".repeat(200);
    expect(headwordId("izon", long).length).toBeLessThanOrEqual(64);
  });

  it("still produces an id for a headword with no ASCII-able letters", () => {
    expect(headwordId("izon", "…")).toMatch(/^izon-entry-[0-9a-z]+$/);
  });

  it("matches the web implementation exactly", () => {
    const webHeadwordId = loadWebHeadwordId();
    for (const word of [...COLLAPSING, "kọn", "Bo okpu kọn.", "…", "ọ".repeat(200)]) {
      expect(webHeadwordId("izon", word)).toBe(headwordId("izon", word));
    }
  });
});
