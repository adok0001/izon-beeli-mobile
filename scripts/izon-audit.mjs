// Izon vocabulary audit. Reads dictionary + corpus .ts files as plain text,
// extracts Izon strings via regex, diffs, and prints two markdown tables.
//
// Usage: node scripts/izon-audit.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, basename } from "node:path";

const ROOT = resolve(new URL(".", import.meta.url).pathname, "..");
const p = (...parts) => resolve(ROOT, ...parts);

const DICT_FILE = p("mobile/lib/data/izon.ts");

// Authoritative translation sources outside the dictionary — used to attach a
// per-token English gloss to audit entries. Order = priority (first hit wins).
const USERIO_GLOSS_FILES = [
  p("userio-docs/izon_vocabulary_complete.csv"),
  p("userio-docs/izon_english_csv.txt"),
  p("userio-docs/izon_english.csv"),
  p("userio-docs/Izon_Other Facts"),
];

// Converted lesson notes + dictionary PDFs (from convert-izon-docs.sh).
const DOCS_TEXT_DIR = p("scripts/.cache/izon-docs-text");
const WILLIAMSON_DICT = p("scripts/.cache/izon-docs-text/Izon dictionary.txt");

const CORPUS_FILES = [
  p("mobile/lib/data/sentences/izon.ts"),
  p("mobile/lib/data/proverbs/izon.ts"),
  p("mobile/lib/data/cultural/izon.ts"),
  p("mobile/lib/data/lessons/izon-first-words.ts"),
  p("mobile/lib/data/lessons/izon-communicative.ts"),
  p("mobile/lib/data/lessons/izon-colours.ts"),
  p("mobile/lib/data/lessons/izon-numbers-trade.ts"),
  p("mobile/lib/data/lessons/izon-oral-tradition.ts"),
  p("mobile/lib/data/lessons/izon-songs.ts"),
  p("mobile/lib/data/lessons/izon-sound-script.ts"),
];

// Proper-noun stoplist (names, places). Lowercased, NFC.
const PROPER_NOUNS = new Set(
  [
    "timi", "ọwei", "owei", "tari", "ebiere", "ebi", "tobi", "tamara", "tike", "sẹiyefa",
    "yenagoa", "kolokuma", "naiziria", "nigeria", "akasa", "ijaw", "izon", "ịzọn",
    "bayelsa", "siteti", "beke", "akenfa",
    "woyengi", "woyingi", "egbesu", "owuamapu", "asasaba", "ekpeti", "izonere", "nduen-ama",
    "iyoro-egba", "seigbein", "biluyu",
    "dvd", "tv", "televisọni",
  ].map((s) => s.normalize("NFC"))
);

const norm = (s) =>
  s
    .normalize("NFC")
    .toLowerCase()
    .replace(/^[\s.,!?;:—–\-"'`()\[\]{}…«»]+|[\s.,!?;:—–"'`()\[\]{}…«»]+$/g, "")
    .trim();

const isProper = (tok) => PROPER_NOUNS.has(tok);

const tokenize = (line) =>
  line
    .split(/[\s/]+/)
    .map(norm)
    .filter((t) => t.length > 1 && !/^\d+$/.test(t) && !/^[₦$€£]/.test(t) && !/^\d/.test(t));

// --- Parse dictionary ----------------------------------------------------
const dictSrc = readFileSync(DICT_FILE, "utf8");
const dictPhrases = new Set();
const dictTokens = new Set();

// Match: e(NUM, "word", "english", "category", ...optional...)
// Word may contain Izon diacritics. Be permissive on the rest of the args.
const E_RE = /\be\(\s*\d+\s*,\s*"([^"]+)"\s*,\s*"([^"]*)"/g;
let m;
let dictCount = 0;
while ((m = E_RE.exec(dictSrc)) !== null) {
  dictCount++;
  const phrase = norm(m[1]);
  if (phrase) dictPhrases.add(phrase);
  for (const t of tokenize(m[1])) dictTokens.add(t);
}

// --- Extract corpus strings ---------------------------------------------
// For each file we identify which fields carry Izon text, then extract the
// double-quoted value. We capture (lineNumber, field, izonText, englishText).

function extractFromFile(file) {
  const src = readFileSync(file, "utf8");
  const fileBase = basename(file);
  const results = []; // { id, izon, english, lineNo }

  // Generic helper: scan line by line, find Izon-bearing field, then look
  // for nearest id + nearest english-gloss field within the same object.
  const lines = src.split("\n");

  // Heuristic per file type:
  const izonFieldNames = {
    "izon.ts": null, // handled per directory below
  };

  // Determine config based on directory of the file:
  const dir = file.includes("/lessons/")
    ? "lessons"
    : file.includes("/sentences/")
      ? "sentences"
      : file.includes("/proverbs/")
        ? "proverbs"
        : file.includes("/cultural/")
          ? "cultural"
          : "other";

  // For each config we list:
  //   izonKey: regex matching the field
  //   englishKey: regex matching the gloss field on same/nearby line
  //   idKey: regex matching the id field
  const cfg = {
    lessons: {
      izonKey: /\btext:\s*"([^"]+)"/,
      englishKey: /\btranslation:\s*"([^"]+)"/,
      idKey: /\bid:\s*"([^"]+)"/,
    },
    sentences: {
      izonKey: /\bsentence:\s*"([^"]+)"/,
      englishKey: /\benglishSentence:\s*"([^"]+)"/,
      idKey: /\bid:\s*"([^"]+)"/,
    },
    proverbs: {
      izonKey: /\btext:\s*"([^"]+)"/,
      englishKey: /\btranslation:\s*"([^"]+)"/,
      idKey: /\bid:\s*"([^"]+)"/,
    },
    cultural: {
      // keyTerms: [{ word: "...", english: "..." }]
      izonKey: /\bword:\s*"([^"]+)"/,
      englishKey: /\benglish:\s*"([^"]+)"/,
      idKey: /\bid:\s*"([^"]+)"/,
    },
  }[dir];

  if (!cfg) return results;

  // Walk objects: split source into balanced { ... } blocks crudely by
  // scanning each line; whenever we hit an izonKey match, look upward/down
  // for englishKey and id within a window of ±15 lines (same object).
  for (let i = 0; i < lines.length; i++) {
    const izMatch = lines[i].match(cfg.izonKey);
    if (!izMatch) continue;
    const izon = izMatch[1];
    // Same-line match first (transcript rows are one-per-line — most accurate).
    let english = null, id = null;
    const sameEm = lines[i].match(cfg.englishKey);
    if (sameEm) english = sameEm[1];
    const sameIm = lines[i].match(cfg.idKey);
    if (sameIm) id = sameIm[1];
    // Fall back to ±15 window only if same-line had nothing (multi-line objects).
    if (!english || !id) {
      for (let j = Math.max(0, i - 15); j <= Math.min(lines.length - 1, i + 15); j++) {
        if (j === i) continue;
        if (!english) {
          const em = lines[j].match(cfg.englishKey);
          if (em) english = em[1];
        }
        if (!id) {
          const im = lines[j].match(cfg.idKey);
          if (im) id = im[1];
        }
      }
    }
    results.push({ id: id || `${fileBase}:${i + 1}`, izon, english: english || "", lineNo: i + 1, fileBase });
  }
  return results;
}

const corpus = [];
for (const f of CORPUS_FILES) {
  corpus.push(...extractFromFile(f));
}

// --- Load userio-docs translation sources --------------------------------
// Map: normalized Izon phrase -> { english, sourceFile, lineNo }
// Phrase-level (multi-word) AND token-level entries are both stored.
const userioGloss = new Map();
const userioTokenGloss = new Map();

const SECTION_HEADERS = new Set([
  "spelling rules", "ịzọn", "phonemes (consonants)", "input", "instruction",
]);

function addUserioEntry(izon, english, sourceFile, lineNo) {
  if (!izon || !english) return;
  const phrase = norm(izon);
  if (!phrase || phrase.length < 2) return;
  if (SECTION_HEADERS.has(phrase)) return;
  // Skip rows where English looks like a section header (no real translation).
  const en = english.trim();
  if (!en || en === "0" || /^[A-Z][a-z]+ Rules$/.test(en)) return;

  if (!userioGloss.has(phrase)) {
    userioGloss.set(phrase, { english: en, sourceFile: basename(sourceFile), lineNo });
  }
  // Also index each constituent token (only for short phrases — long sentence
  // glosses don't map per-token).
  const toks = tokenize(izon);
  if (toks.length <= 3) {
    for (const t of toks) {
      if (!userioTokenGloss.has(t)) {
        userioTokenGloss.set(t, { english: en, sourceFile: basename(sourceFile), lineNo, phrase });
      }
    }
  }
}

// Parse the Williamson & Blench Kolokuma Izon dictionary (13k lines).
// Format per entry: HEADWORD pos-abbrev. gloss [: example]
// Entries wrap across multiple lines; new entry starts when a non-indented
// line begins with a word followed by a POS abbreviation like "n.", "v.t.", etc.
function loadWilliamsonDict() {
  let src;
  try { src = readFileSync(WILLIAMSON_DICT, "utf8"); } catch { return; }
  const lines = src.split("\n");
  const POS = /^([\p{L}\p{M}\d''\-]+(?:\s[\p{L}\p{M}\d''\-]+)?)\s+(n|v\.?t|v\.?i|v|adj|adv|excl|conj|pron|num|interj|prep|aux|part|comp|exc|qu|n\.pl|loc)\b\.?\s*(?:\[\d+\])?\s*(.*)$/u;
  for (let i = 0; i < lines.length; i++) {
    // Two-column PDF: split on runs of 6+ spaces to separate L/R columns.
    const halves = lines[i].split(/\s{6,}/).map((s) => s.trim()).filter(Boolean);
    for (const half of halves) {
      const m = half.match(POS);
      if (!m) continue;
      const headword = m[1].trim();
      let gloss = m[3].trim();
      // Trim at first ":" (which precedes example) or ";" (sense separator we keep first).
      const cut = gloss.indexOf(":");
      if (cut > 0) gloss = gloss.slice(0, cut).trim();
      if (!gloss || gloss.length < 2) continue;
      // Skip headwords that are actually English words (heuristic: pure ASCII
      // lowercase + length<3 sometimes — but we trust the dictionary structure).
      addUserioEntry(headword, gloss, WILLIAMSON_DICT, i + 1);
    }
  }
}
loadWilliamsonDict();

// Also ingest every other converted lesson note .txt — they sometimes have
// "Izon, English" or "Izon: English" lines we can pick up with the generic loader.
function listDocsTextFiles() {
  let entries;
  try { entries = readdirSync(DOCS_TEXT_DIR); } catch { return []; }
  return entries
    .filter((f) => f.endsWith(".txt") && !f.startsWith("Izon dictionary"))
    .map((f) => resolve(DOCS_TEXT_DIR, f));
}
const EXTRA_GLOSS_FILES = listDocsTextFiles();

for (const file of [...USERIO_GLOSS_FILES, ...EXTRA_GLOSS_FILES]) {
  let src;
  try { src = readFileSync(file, "utf8"); } catch { continue; }
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Split on first comma OR first colon (Izon_Other Facts uses both).
    let sepIdx = -1;
    // Prefer ": " then ", " then "," then ":"
    for (const sep of [": ", ", ", ",", ":"]) {
      const idx = line.indexOf(sep);
      if (idx > 0) { sepIdx = idx; break; }
    }
    if (sepIdx === -1) continue;
    const izon = line.slice(0, sepIdx).trim();
    let english = line.slice(sepIdx + 1).trim();
    // CSV rows have a trailing ",Translate the following..." instruction — strip it.
    english = english.replace(/,\s*Translate the following.*$/i, "");
    addUserioEntry(izon, english, file, i + 1);
  }
}

// Build a token-level gloss index: rows whose Izon field is a single token
// (or a short delimited list like "a; b" / "a / b" / "a · b") give us a
// direct 1-to-1 gloss for that token. Also harvest from morphology rows like
// "X + Y → Z" where the English explains the resulting Z.
const tokenGloss = new Map(); // token -> { english, fileBase, id }
const splitDelims = /[;·•|/]|\s+—\s+|\s+→\s+|\s+↔\s+/;
for (const row of corpus) {
  if (!row.english) continue;
  const parts = row.izon.split(splitDelims).map((s) => s.trim()).filter(Boolean);
  // Only count rows where every part is a single bare token (no spaces) —
  // these are vocabulary-list cells with a direct gloss for each variant.
  if (parts.length === 0) continue;
  const allSingleTokens = parts.every((p) => !/\s/.test(p) && p.length > 0);
  if (!allSingleTokens) continue;
  for (const p of parts) {
    const tok = norm(p);
    if (!tok) continue;
    if (!tokenGloss.has(tok)) {
      tokenGloss.set(tok, { english: row.english.trim(), fileBase: row.fileBase, id: row.id });
    }
  }
}

// --- Diff ----------------------------------------------------------------
// For each corpus row, tokenize Izon line. For each token not in dictTokens
// and not part of a multi-word dict phrase substring, record candidate.

const bucketA = []; // 100% sure: token + row has english gloss + not proper
const bucketB = []; // false-positive candidates

// Map: token -> first occurrence row (to dedupe). Also keep all-occurrence count.
const seenA = new Map();
const seenB = new Map();

function dictMatchesPhrase(izonLine) {
  // Returns set of dict phrases fully contained in the line (normalized).
  const linePhrase = norm(izonLine);
  const found = new Set();
  for (const phrase of dictPhrases) {
    if (phrase.includes(" ") && linePhrase.includes(phrase)) {
      found.add(phrase);
    }
  }
  return found;
}

const IZON_DIACRITIC_RE = /[ẹọịụṅḅ]/i;
const isIzonRow = (line, tokens) => {
  if (IZON_DIACRITIC_RE.test(line)) return true;
  if (tokens.length === 0) return false;
  let hits = 0;
  for (const t of tokens) if (dictTokens.has(t)) hits++;
  return hits / tokens.length >= 0.34; // at least a third of tokens are dict-Izon
};

for (const row of corpus) {
  const izTokens = tokenize(row.izon);
  if (!isIzonRow(row.izon, izTokens)) continue; // skip English narrative rows
  const phraseHits = dictMatchesPhrase(row.izon);
  const phraseTokens = new Set();
  for (const ph of phraseHits) for (const t of tokenize(ph)) phraseTokens.add(t);

  for (const tok of izTokens) {
    if (dictTokens.has(tok)) continue;
    if (phraseTokens.has(tok)) continue;

    // Classify
    const reasons = [];
    if (isProper(tok)) reasons.push("proper noun");
    // diacritic-stripped version is in dictionary?
    const stripped = tok.replace(/[ẹịọ]/g, (c) => ({ ẹ: "e", ị: "i", ọ: "o" })[c]);
    let diacriticVariant = false;
    if (stripped !== tok) {
      for (const d of dictTokens) {
        const dStripped = d.replace(/[ẹịọ]/g, (c) => ({ ẹ: "e", ị: "i", ọ: "o" })[c]);
        if (dStripped === stripped) { diacriticVariant = true; break; }
      }
    }
    if (diacriticVariant) reasons.push(`diacritic variant of dict word`);
    // inflection: tok startsWith or endsWith a dict token (≥3 chars)
    let inflection = false;
    if (tok.length >= 4) {
      for (const d of dictTokens) {
        if (d.length >= 3 && (tok.startsWith(d) || tok.endsWith(d)) && d !== tok) {
          inflection = true; break;
        }
      }
    }
    if (inflection) reasons.push("possible inflection/agglutination");
    if (!row.english) reasons.push("no english gloss on row");

    if (reasons.length === 0) {
      if (!seenA.has(tok)) seenA.set(tok, row);
    } else {
      if (!seenB.has(tok)) seenB.set(tok, { row, reasons });
    }
  }
}

// --- Emit markdown -------------------------------------------------------
const escapePipes = (s) => String(s).replace(/\|/g, "\\|");

console.log(`<!-- dictionary entries parsed: ${dictCount} | unique dict tokens: ${dictTokens.size} | corpus rows: ${corpus.length} -->`);
console.log("");
console.log(`### Bucket A — 100%-sure missing entries (${seenA.size})`);
console.log("");
console.log("| Izon token | Inferred English | Gloss source | Corpus source | Row id | Example line | Row translation |");
console.log("|---|---|---|---|---|---|---|");
const aRows = [...seenA.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [tok, row] of aRows) {
  const u = userioTokenGloss.get(tok);
  const g = tokenGloss.get(tok);
  let inferred = "—", glossSource = "";
  if (u) { inferred = u.english; glossSource = `${u.sourceFile}:${u.lineNo}`; }
  else if (g) { inferred = g.english; glossSource = `${g.fileBase}:${g.id}`; }
  console.log(
    `| ${escapePipes(tok)} | ${escapePipes(inferred)} | ${escapePipes(glossSource)} | ${row.fileBase}:${row.lineNo} | ${escapePipes(row.id)} | ${escapePipes(row.izon)} | ${escapePipes(row.english)} |`
  );
}

console.log("");
console.log(`### Bucket B — False-positive candidates (${seenB.size})`);
console.log("");
console.log("| Izon token | Inferred English | Gloss source | Why flagged | Corpus source | Row id | Example line |");
console.log("|---|---|---|---|---|---|---|");
const bRows = [...seenB.entries()].sort((a, b) => a[0].localeCompare(b[0]));
for (const [tok, { row, reasons }] of bRows) {
  const u = userioTokenGloss.get(tok);
  const g = tokenGloss.get(tok);
  let inferred = "—", glossSource = "";
  if (u) { inferred = u.english; glossSource = `${u.sourceFile}:${u.lineNo}`; }
  else if (g) { inferred = g.english; glossSource = `${g.fileBase}:${g.id}`; }
  console.log(
    `| ${escapePipes(tok)} | ${escapePipes(inferred)} | ${reasons.join("; ")} | ${row.fileBase}:${row.lineNo} | ${escapePipes(row.id)} | ${escapePipes(row.izon)} |`
  );
}
