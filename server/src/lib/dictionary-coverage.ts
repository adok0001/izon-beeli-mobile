/**
 * Dictionary coverage — finds transcript words with no dictionary entry.
 *
 * Lesson transcripts and dictionary entries are authored independently, so
 * nothing guarantees a word sung or spoken in a lesson can be looked up.
 * This module tokenizes transcript text and diffs it against the dictionary.
 * Used by the educator coverage endpoint and the seed audit script.
 */

// Letters, combining marks (tone diacritics), digits, plus apostrophes and
// hyphens that occur word-internally in several of our languages.
const TOKEN_RE = /[\p{L}\p{M}\p{N}'’‘ʼ-]+/gu;
const EDGE_TRIM_RE = /^['’‘ʼ-]+|['’‘ʼ-]+$/g;
const DIGITS_ONLY_RE = /^\p{N}+$/u;

export function tokenize(text: string): string[] {
  const tokens: string[] = [];
  for (const raw of text.toLocaleLowerCase().match(TOKEN_RE) ?? []) {
    const token = raw.replace(EDGE_TRIM_RE, "");
    if (token && !DIGITS_ONLY_RE.test(token)) tokens.push(token);
  }
  return tokens;
}

export interface CoverageSegment {
  lessonId: string;
  text: string;
}

export interface CoverageLesson {
  id: string;
  title: string;
}

export interface MissingWord {
  word: string;
  count: number;
  lessons: CoverageLesson[];
}

export interface CoverageReport {
  distinctWords: number;
  coveredWords: number;
  missing: MissingWord[];
}

const MAX_LESSONS_PER_WORD = 5;

// Some lesson transcripts contain English narration (story lessons, stage
// directions). English function words would otherwise dominate the report,
// so they are skipped along with any caller-supplied English vocabulary.
const ENGLISH_STOPWORDS = new Set(
  `a an the and or but nor so yet of to in on at by for with from into onto over under up down out off
   is are was were be been being am do does did done have has had will would shall should can could may
   might must i you he she it we they me him her us them my your his its our their this that these those
   what which who whom whose when where why how not no yes as if then than there here also very just
   about after before between through during against all any both each few more most other some such
   only own same too s t don now once`.split(/\s+/),
);

/**
 * Diff transcript tokens against the dictionary. A word counts as covered if
 * it matches a whole dictionary entry or any token of a multi-word entry
 * (phrase entries make their words findable via search). Tokens in
 * `englishWords` (e.g. the english_wordbank) are treated as narration, not
 * missing native vocabulary, and excluded entirely.
 */
export function computeCoverage(
  segments: CoverageSegment[],
  dictionaryWords: string[],
  lessonsById: Map<string, CoverageLesson>,
  englishWords: string[] = [],
): CoverageReport {
  const ignored = new Set(ENGLISH_STOPWORDS);
  for (const word of englishWords) {
    for (const token of tokenize(word)) ignored.add(token);
  }

  const covered = new Set<string>();
  for (const word of dictionaryWords) {
    for (const token of tokenize(word)) covered.add(token);
  }
  // A native dictionary word that happens to collide with English is still native.
  for (const token of covered) ignored.delete(token);

  const missingByWord = new Map<string, { count: number; lessonIds: Set<string> }>();
  const seen = new Set<string>();
  for (const segment of segments) {
    for (const token of tokenize(segment.text)) {
      if (ignored.has(token)) continue;
      seen.add(token);
      if (covered.has(token)) continue;
      const entry = missingByWord.get(token) ?? { count: 0, lessonIds: new Set() };
      entry.count += 1;
      entry.lessonIds.add(segment.lessonId);
      missingByWord.set(token, entry);
    }
  }

  const missing = [...missingByWord.entries()]
    .map(([word, { count, lessonIds }]) => ({
      word,
      count,
      lessons: [...lessonIds]
        .slice(0, MAX_LESSONS_PER_WORD)
        .map((id) => lessonsById.get(id) ?? { id, title: id }),
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return {
    distinctWords: seen.size,
    coveredWords: seen.size - missing.length,
    missing,
  };
}
