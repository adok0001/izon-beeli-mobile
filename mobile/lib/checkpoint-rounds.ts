import { CHECKPOINT_FORMATS, type CheckpointFormat } from "@/lib/checkpoints";
import type { DictionaryEntry } from "@/lib/dictionary";
import { localize } from "@/lib/localize";
import { pickDistractors } from "@/lib/quiz-engine";
import { shuffle } from "@/lib/shuffle";
import type { AudioSource, LessonType, LessonWord, TranscriptSegment } from "@/types";

/**
 * Checkpoint round builder — turns the five lessons a checkpoint covers into
 * the questions it asks.
 *
 * Seeded from what the learner actually just did: the covered lessons'
 * transcripts, plus the dictionary entries whose words appear in them. Drawing
 * on the language-wide dictionary unfiltered would let a gate ask about words
 * from lessons the learner hasn't reached, which would make it unfair.
 *
 * Rounds are **interleaved by design**: a checkpoint mixes question types
 * rather than running one format straight through, because blocked practice
 * inflates in-session accuracy without improving retention. `format` sets which
 * type leads and dominates the mix, not the whole round.
 *
 * Pure — `rng` is injectable so the interleave is reproducible under test.
 */

export const CHECKPOINT_QUESTION_COUNT = 8;

/** Options per multiple choice question, minus the correct answer. */
const DISTRACTOR_COUNT = 3;

/** Shortest token count worth asking the learner to reorder. */
const MIN_ORDER_TOKENS = 3;
const MAX_ORDER_TOKENS = 7;

export type CheckpointQuestionKind = "choice" | "order";

/** Formats that ask about a single word rather than a whole line. */
function isWordFormat(format: CheckpointFormat): boolean {
  return format === "recall" || format === "match";
}

interface BaseQuestion {
  id: string;
  /** Which format produced this question — drives the eyebrow label. */
  format: CheckpointFormat;
  /** The lesson it came from, so a miss can point the learner back. */
  lessonId: string;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: "choice";
  /** What the learner reads. Empty for a listening question — the audio is the prompt. */
  prompt: string;
  correct: string;
  options: string[];
  /** Present only on listening questions: the segment to play. */
  audio?: { source: AudioSource; startTime: number; endTime: number };
}

export interface OrderQuestion extends BaseQuestion {
  kind: "order";
  /** The meaning to build, shown above the token tray. */
  prompt: string;
  /** Shuffled tokens the learner taps into place. */
  tokens: string[];
  /** The target order. */
  correct: string[];
}

export type CheckpointQuestion = ChoiceQuestion | OrderQuestion;

/** The slice of a lesson a checkpoint round needs. */
export interface CheckpointLessonSource {
  id: string;
  /**
   * `"game"` marks the block-closing game row rather than a lesson. Its
   * segments are a word list, not dialogue — see `gatherVocab`.
   */
  type?: LessonType | null;
  /**
   * Lesson-authored key words. The API doesn't serve these yet, so in practice
   * word questions come from the game row and the dictionary intersection
   * below — this stays wired so authored vocab is used the moment it exists.
   */
  vocab?: LessonWord[];
  transcript?: TranscriptSegment[];
  audioUrl?: AudioSource;
}

type Rng = () => number;

/** Normalised key for dedupe and correct-answer comparison. */
function norm(s: string): string {
  return s.toLowerCase().trim();
}

/**
 * Authoring placeholders and review markers, which must never become a question.
 *
 * Live content is not uniformly finished. Movement 1 currently ships 80 lines
 * whose text reads `[[NEEDS IZON]]` — a slot waiting on a speaker — and one
 * carrying a `⚠ TONE REQUIRED` note in its translation. Both have a real
 * English meaning attached, so every "is this line usable" test based on
 * non-emptiness passes them, and they become listening answers, order prompts,
 * and two junk tokens (`[[needs`, `izon]]`) in the word map that word questions
 * are built from.
 *
 * Asking a learner to translate a build artifact is worse than asking one
 * question fewer, so an unfinished line is dropped from the pool rather than
 * patched. The gap stays visible in the lesson, where it belongs.
 */
const UNFINISHED = /\[\[|\]\]|⚠/;

/** Whether a text/meaning pair is finished enough to be asked about. */
function isTeachable(text: string, meaning: string): boolean {
  return !!text && !!meaning && !UNFINISHED.test(text) && !UNFINISHED.test(meaning);
}

interface VocabItem {
  lessonId: string;
  word: string;
  meaning: string;
}

interface SegmentItem {
  lessonId: string;
  text: string;
  meaning: string;
  startTime: number;
  endTime: number;
  lessonAudio?: AudioSource;
}

/** Word-boundary tokens of a transcript line, normalised for matching. */
function tokensOf(text: string): string[] {
  return text
    .split(/\s+/)
    .map((t) => norm(t).replace(/[.,!?;:'"()]/g, ""))
    .filter(Boolean);
}

/**
 * The word-level pool: lesson-authored vocab where it exists, plus dictionary
 * entries whose word appears in one of the covered transcripts.
 *
 * The intersection is what keeps a gate honest — it asks about words the
 * learner met in these five lessons, not the whole language.
 */
function gatherVocab(
  lessons: CheckpointLessonSource[],
  dictionary: DictionaryEntry[]
): VocabItem[] {
  const seen = new Set<string>();
  const out: VocabItem[] = [];

  const add = (lessonId: string, word: string, meaning: string) => {
    const key = norm(word);
    if (!key || seen.has(key) || !isTeachable(word, meaning)) return;
    seen.add(key);
    out.push({ lessonId, word, meaning });
  };

  for (const lesson of lessons) {
    for (const w of lesson.vocab ?? []) {
      add(lesson.id, w.text?.trim() ?? "", localize(w.translation, "en").trim());
    }
    // A game row's segments are its authored word list, not dialogue: words
    // held back from the transcripts precisely so the closing game could draw
    // on them (Movement 1's Endi-areama fish names, the `sịlị … akpa` money
    // scale). They belong to this block, so they need no dictionary
    // intersection to be fair — the block is where they were set aside.
    if (lesson.type !== "game") continue;
    for (const s of lesson.transcript ?? []) {
      add(lesson.id, s.text?.trim() ?? "", localize(s.translation, "en").trim());
    }
  }

  // Which covered lesson each transcript word belongs to, so a question can
  // still point back at its source. Unfinished lines are skipped here too, or
  // their placeholder brackets enter the map as tokens and start matching
  // dictionary words that the learner never actually met.
  const wordToLesson = new Map<string, string>();
  for (const lesson of lessons) {
    if (lesson.type === "game") continue; // already added whole, above
    for (const segment of lesson.transcript ?? []) {
      const text = segment.text ?? "";
      if (!isTeachable(text, localize(segment.translation, "en"))) continue;
      for (const token of tokensOf(text)) {
        if (!wordToLesson.has(token)) wordToLesson.set(token, lesson.id);
      }
    }
  }

  for (const entry of dictionary) {
    const lessonId = wordToLesson.get(norm(entry.word));
    if (!lessonId) continue;
    add(lessonId, entry.word, localize(entry.english, "en").trim());
  }

  return out;
}

/** Flatten the covered lessons' transcript lines into usable, deduplicated items. */
function gatherSegments(lessons: CheckpointLessonSource[]): SegmentItem[] {
  const seen = new Set<string>();
  const out: SegmentItem[] = [];
  for (const lesson of lessons) {
    // A game row holds single words, not lines — asking a learner to reorder
    // the tokens of a one-word entry is not a sentence-building question.
    if (lesson.type === "game") continue;
    for (const s of lesson.transcript ?? []) {
      const text = s.text?.trim() ?? "";
      const meaning = localize(s.translation, "en").trim();
      if (!isTeachable(text, meaning)) continue;
      const key = norm(text);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        lessonId: lesson.id,
        text,
        meaning,
        startTime: s.startTime,
        endTime: s.endTime,
        lessonAudio: lesson.audioUrl,
      });
    }
  }
  return out;
}

/**
 * Build every multiple-choice question a pool can support.
 *
 * The three choice formats differ only in which field is the prompt, which is
 * the answer, and whether audio replaces the text prompt — so they share one
 * builder rather than three near-copies. A question whose pool can't yield
 * enough distinct distractors is dropped, never padded.
 */
function buildChoices<T extends { lessonId: string }>(
  items: T[],
  format: CheckpointFormat,
  promptOf: (item: T) => string,
  answerOf: (item: T) => string,
  rng: Rng,
  audioOf?: (item: T) => ChoiceQuestion["audio"] | undefined
): ChoiceQuestion[] {
  const pool = items.map(answerOf);
  return items.flatMap((item, i) => {
    const correct = answerOf(item);
    const audio = audioOf?.(item);
    // A listening question with no clip to play would be unanswerable.
    if (audioOf && !audio) return [];
    const distractors = pickDistractors(correct, pool, DISTRACTOR_COUNT);
    if (distractors.length < DISTRACTOR_COUNT) return [];
    return [
      {
        kind: "choice" as const,
        format,
        id: `${format}-${item.lessonId}-${i}`,
        lessonId: item.lessonId,
        // The audio *is* the prompt for a listening question; showing the text
        // alongside would answer it.
        prompt: audio ? "" : promptOf(item),
        correct,
        options: shuffle([correct, ...distractors], rng),
        ...(audio ? { audio } : {}),
      },
    ];
  });
}

/** meaning → build the sentence from shuffled tokens. */
function buildOrder(segments: SegmentItem[], rng: Rng): OrderQuestion[] {
  return segments.flatMap((item, i) => {
    const tokens = item.text.split(/\s+/).filter(Boolean);
    if (tokens.length < MIN_ORDER_TOKENS || tokens.length > MAX_ORDER_TOKENS) return [];
    // A shuffle that lands back on the original order would show the answer
    // pre-solved; retry once, then drop rather than loop.
    let shuffled = shuffle(tokens, rng);
    if (shuffled.join(" ") === tokens.join(" ")) shuffled = shuffle(tokens, rng);
    if (shuffled.join(" ") === tokens.join(" ")) return [];
    return [
      {
        kind: "order" as const,
        format: "build" as const,
        id: `build-${item.lessonId}-${i}`,
        lessonId: item.lessonId,
        prompt: item.meaning,
        tokens: shuffled,
        correct: tokens,
      },
    ];
  });
}

/**
 * Build a checkpoint's round.
 *
 * The lead `format` fills roughly half the round; the rest interleaves the
 * other available types, round-robin, so no two consecutive questions share a
 * type where the pool allows it. Returns fewer than `count` questions — or none
 * — when the covered lessons are too thin to ask fair questions; the caller
 * treats an empty round as "nothing to gate on" rather than an automatic fail.
 */
export function buildCheckpointRound(
  lessons: CheckpointLessonSource[],
  format: CheckpointFormat,
  dictionary: DictionaryEntry[] = [],
  count: number = CHECKPOINT_QUESTION_COUNT,
  rng: Rng = Math.random
): CheckpointQuestion[] {
  const vocab = gatherVocab(lessons, dictionary);
  const segments = gatherSegments(lessons);

  const byFormat: Record<CheckpointFormat, CheckpointQuestion[]> = {
    recall: shuffle(
      buildChoices(vocab, "recall", (v) => v.word, (v) => v.meaning, rng),
      rng
    ),
    match: shuffle(
      buildChoices(vocab, "match", (v) => v.meaning, (v) => v.word, rng),
      rng
    ),
    listen: shuffle(
      buildChoices(
        segments,
        "listen",
        () => "",
        (s) => s.meaning,
        rng,
        (s) =>
          s.lessonAudio
            ? { source: s.lessonAudio, startTime: s.startTime, endTime: s.endTime }
            : undefined
      ),
      rng
    ),
    build: shuffle(buildOrder(segments, rng), rng),
  };

  // Lead format first, then the rest — the round-robin below draws in this
  // order, so the lead naturally takes the largest share of a short round.
  const rotation: CheckpointFormat[] = [
    format,
    ...CHECKPOINT_FORMATS.filter((f) => f !== format),
  ];

  // A block that declares its own word list gets a word format to lead with.
  // Those words were held OUT of every transcript precisely so the closing game
  // would drill them, so a round that leads with sentence-building spends five
  // of its eight questions on transcript lines and touches the authored list
  // about once — which is not the job the list exists to do. Which word format
  // leads still comes from the rotation, so consecutive gates stay varied.
  const hasAuthoredWords = lessons.some(
    (l) => l.type === "game" && (l.transcript?.length ?? 0) > 0
  );
  const preference = hasAuthoredWords
    ? [...rotation.filter(isWordFormat), ...rotation.filter((f) => !isWordFormat(f))]
    : rotation;

  // The lead is a *preference*, and the content may not support it. Movement 1
  // carries no audio on any lesson, so a gate the rotation hands `listen` leads
  // with an empty pool and quietly becomes whatever the round-robin can scrape
  // — the round loses its shape and no longer matches the format its own
  // eyebrow announces. Fall forward to the first format that can be filled.
  const lead = preference.find((f) => byFormat[f].length > 0) ?? format;
  const order = [lead, ...rotation.filter((f) => f !== lead)];

  const picked: CheckpointQuestion[] = [];
  const cursors: Record<string, number> = {};

  // Lead format up to its quota…
  const leadPool = byFormat[lead];
  cursors[lead] = Math.min(Math.ceil(count / 2), leadPool.length);
  picked.push(...leadPool.slice(0, cursors[lead]));

  // …then round-robin the remainder so types alternate rather than clump.
  let progressed = true;
  while (picked.length < count && progressed) {
    progressed = false;
    for (const f of order) {
      if (picked.length >= count) break;
      const pool = byFormat[f];
      const cursor = cursors[f] ?? 0;
      if (cursor >= pool.length) continue;
      picked.push(pool[cursor]);
      cursors[f] = cursor + 1;
      progressed = true;
    }
  }

  return picked;
}

/** Whether an answer to a question is correct. */
export function isCorrectAnswer(question: CheckpointQuestion, answer: string[] | string): boolean {
  if (question.kind === "choice") {
    return typeof answer === "string" && norm(answer) === norm(question.correct);
  }
  const given = Array.isArray(answer) ? answer : [answer];
  return given.length === question.correct.length && given.join(" ") === question.correct.join(" ");
}
