import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import {
  canonicalGloss,
  GLOSS_COLUMN_LIMIT,
  isGlossOverflow,
  isLossyGloss,
  mergeSense,
  parseSenses,
  quizSense,
  projectSenses,
  type Sense,
} from "../senses.js";

/**
 * `parseSenses` exists twice — the app renders senses from the flat `english`
 * column, and the server explodes that column into rows. If the two drift, a
 * gloss looks one way in the dictionary and is stored another way in the
 * database, which is the failure the shared corpus is meant to end.
 *
 * The API deploys from `server/` alone and has no path alias into the app, so
 * the parity test loads the mobile source from disk (dev/CI only) and runs both
 * over the same fixtures.
 */
const MOBILE_DICTIONARY = join(__dirname, "../../../../mobile/lib/dictionary.ts");

function loadMobile(): {
  parseSenses: (raw: string) => Sense[];
  projectSenses: (s: Sense[]) => string;
  quizSense: (english: string) => unknown;
} {
  const { outputText } = ts.transpileModule(readFileSync(MOBILE_DICTIONARY, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  });
  // dictionary.ts imports `@/types` (an Expo path alias, not a real module) for
  // types only, so the emitted `require` is a no-op stub away from evaluating.
  const exports: Record<string, unknown> = {};
  new Function("exports", "require", outputText)(exports, () => ({}));
  return exports as ReturnType<typeof loadMobile>;
}

/** Real corpus glosses, one per behaviour the parser has to get right. */
const CORPUS = [
  "n. bag; sack; pocket (general term; cf. akpụ́rụ̀) ; B. belly (of humans)",
  "corrugated iron sheet(s)",
  "guerrilla war(fare)",
  "n. handcuff(s)",
  "And (conjunction; consonant phoneme m)",
  "v.t. tie ends of cloth behind neck, usu. bịdẹ́ àbaaraí;̣ B. hang object by string",
  "(greeting — call: good day)",
  "one (traditional counting)",
  "n. favour;",
  "n. deep floating net; seine (net); ; birémùkásà kọn fish with seine net",
];

describe("parseSenses", () => {
  it("splits on top-level semicolons only", () => {
    expect(parseSenses("And (conjunction; consonant phoneme m)")).toHaveLength(1);
    expect(parseSenses("way; road; path")).toHaveLength(3);
  });

  it("lifts a spaced trailing parenthetical into a note", () => {
    expect(parseSenses("one (traditional counting)")).toEqual([
      { text: "one", note: "traditional counting" },
    ]);
  });

  it("leaves inflectional morphology in the gloss", () => {
    // The bug this replaced: gloss "corrugated iron sheet" + note "s".
    expect(parseSenses("corrugated iron sheet(s)")).toEqual([{ text: "corrugated iron sheet(s)" }]);
    expect(parseSenses("guerrilla war(fare)")).toEqual([{ text: "guerrilla war(fare)" }]);
  });

  it("keeps a whole-parenthetical sense as its own gloss", () => {
    expect(parseSenses("(greeting — call)")).toEqual([{ text: "(greeting — call)" }]);
  });

  it("keeps a combining mark typed after its semicolon on the sense it belongs to", () => {
    const [first, second] = parseSenses("usu. abaaraí;̣ B. hang object");
    expect(first.text).toBe("usu. abaaraị́");
    expect(second.text).toBe("B. hang object");
    expect(second.text.normalize("NFC")).not.toMatch(/^\p{Mn}/u);
  });

  it("drops empty senses left by a trailing or doubled semicolon", () => {
    expect(parseSenses("n. favour;")).toEqual([{ text: "n. favour" }]);
    expect(parseSenses("a; ; b")).toHaveLength(2);
  });

  it("takes the last parenthetical when a gloss has several", () => {
    expect(parseSenses("n. butterfly fish (Pantodon buchholzi) (lit. ‘girls’ breast’)")).toEqual([
      { text: "n. butterfly fish (Pantodon buchholzi)", note: "lit. ‘girls’ breast’" },
    ]);
  });

  it("matches the mobile implementation exactly, in both directions", () => {
    const mobile = loadMobile();
    for (const raw of CORPUS) {
      expect(mobile.parseSenses(raw)).toEqual(parseSenses(raw));
      expect(mobile.projectSenses(parseSenses(raw))).toBe(projectSenses(parseSenses(raw)));
      // The quiz answer must be the same on both sides: the app grades a
      // learner's tap against what the API generated the question from.
      expect(mobile.quizSense(raw)).toEqual(quizSense(raw));
    }
  });
});

describe("quizSense", () => {
  it("asks about the primary sense, not the whole column", () => {
    expect(quizSense("way; road; path")).toEqual({
      answer: "way",
      siblings: ["way", "road", "path"],
      senseCount: 3,
    });
  });

  it("keeps a disambiguating note on the sense it belongs to", () => {
    expect(quizSense("bag; belly (of humans)")?.siblings).toEqual(["bag", "belly (of humans)"]);
  });

  it("leaves a single-sense entry untouched", () => {
    expect(quizSense("take")).toEqual({ answer: "take", siblings: ["take"], senseCount: 1 });
  });

  it("returns null for a gloss with no senses at all", () => {
    expect(quizSense("   ")).toBeNull();
    expect(quizSense(";;")).toBeNull();
  });
});

describe("projectSenses", () => {
  it("preserves every sense of a real gloss", () => {
    for (const raw of CORPUS) {
      expect(parseSenses(projectSenses(parseSenses(raw)))).toEqual(parseSenses(raw));
    }
  });

  it("round-trips a note back into its parentheses", () => {
    expect(projectSenses([{ text: "one", note: "traditional counting" }])).toBe(
      "one (traditional counting)",
    );
  });

  it("does not emit a leading space for a sense that is only a note", () => {
    expect(projectSenses([{ text: "", note: "greeting" }])).toBe("(greeting)");
  });

  it("drops empty senses rather than emitting a bare semicolon", () => {
    expect(projectSenses([{ text: "way" }, { text: "  " }, { text: "road" }])).toBe("way; road");
  });
});

describe("canonicalGloss", () => {
  it("normalizes only the whitespace the split has to touch", () => {
    // ` ; ` → `; `, a doubled `;`, a trailing `;` — 78 live entries, all benign.
    expect(canonicalGloss("n. bag (general) ; B. belly")).toBe("n. bag (general); B. belly");
    expect(canonicalGloss("n. deep floating net; seine (net); ; kọn")).toBe(
      "n. deep floating net; seine (net); kọn",
    );
  });

  it("settles in one pass, which is what makes the cutover safe to repeat", () => {
    // Adversarial inputs: unbalanced parens either way, a stray combining mark,
    // empty senses, a parenthetical the note regex must refuse (it forbids
    // nesting, so "(see b (c))" stays in the gloss rather than re-splitting).
    const ADVERSARIAL = ["a (b; c", "a) b; c", ";;;", "a ()", "(x)", "a;̣ b", "   ", "a (see b (c))"];
    for (const raw of [...CORPUS, ...ADVERSARIAL]) expect(isLossyGloss(raw)).toBe(false);
  });
});

describe("mergeSense", () => {
  it("appends an approved meaning as a new sense", () => {
    expect(mergeSense("way; road", "path")).toBe("way; road; path");
  });

  it("compares whole senses, not substrings", () => {
    // The bug this replaced: `"always".includes("way")` silently discarded the
    // approved contribution and the entry never gained the meaning.
    expect(mergeSense("always", "way")).toBe("always; way");
    expect(mergeSense("way; road", "way")).toBeNull();
  });

  it("matches a sense whose note is written out in the addition", () => {
    expect(mergeSense("one (traditional counting)", "one (traditional counting)")).toBeNull();
  });

  it("is case-insensitive about what already exists", () => {
    expect(mergeSense("Way; road", "way")).toBeNull();
  });

  it("refuses a merge that would overflow varchar(500) instead of throwing 22001", () => {
    const full = "a".repeat(GLOSS_COLUMN_LIMIT - 2);
    expect(mergeSense(full, "bcd")).toBeNull();
    expect(mergeSense("short", "b")?.length).toBeLessThanOrEqual(GLOSS_COLUMN_LIMIT);
  });

  it("ignores an empty addition", () => {
    expect(mergeSense("way", "   ")).toBeNull();
  });
});

describe("isGlossOverflow", () => {
  it("recognizes an example column holding a truncated gloss's continuation", () => {
    const english = "n. sense; mind; thought; ịkịyọ́ụ gbụ̀rụrụụ́ recollect; remem";
    expect(isGlossOverflow(english, `${english}ber; recall: Ine bara`)).toBe(true);
  });

  it("leaves a real usage example alone", () => {
    expect(isGlossOverflow("n. way; road", "bịsá bàra kị")).toBe(false);
  });

  it("does not treat an empty gloss as a prefix of everything", () => {
    expect(isGlossOverflow("", "bịsá bàra kị")).toBe(false);
  });
});
