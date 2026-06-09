import type { DictionaryEntry } from "@/lib/dictionary";
import type { AudioSource, MatchingGameConfig, MatchingPair, QuestionType, QuizConfig, QuizQuestion, SentenceTemplate, TranscriptSegment } from "@/types";

/** Optional translate function passed from a React component via useTranslation(). */
export type QuizTranslateFn = (key: string, opts?: Record<string, unknown>) => string;

interface QuizPool {
  word: string;
  english: string;
  category?: string;
  audioSource?: AudioSource;
  example?: string;
  exampleTranslation?: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Picks `count` distractors from `pool`, excluding the correct answer.
 * Deduplicates case-insensitively so "Run" and "run" don't both appear.
 */
function pickDistractors(correct: string, pool: string[], count: number): string[] {
  const correctNorm = correct.toLowerCase().trim();
  const seen = new Set<string>([correctNorm]);
  const candidates: string[] = [];
  for (const s of pool) {
    const norm = s.toLowerCase().trim();
    if (!seen.has(norm)) {
      seen.add(norm);
      candidates.push(s);
    }
  }
  return shuffle(candidates).slice(0, count);
}

function gatherDictionaryPool(
  entries: DictionaryEntry[],
  category?: string
): QuizPool[] {
  const filtered = category
    ? entries.filter((e) => e.category === category)
    : entries;

  return filtered.map((e) => ({
    word: e.word,
    english: e.english,
    category: e.category,
    audioSource: (e as any).audioUrl,
    example: e.example,
    exampleTranslation: e.exampleTranslation,
  }));
}

function makeWordToEnglish(
  item: QuizPool,
  allEnglish: string[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const distractors = pickDistractors(item.english, allEnglish, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "word-to-english",
    prompt: translate
      ? translate("quiz.promptWordToEnglish", { word: item.word })
      : `What does "${item.word}" mean in English?`,
    correctAnswer: item.english,
    options: shuffle([item.english, ...distractors]),
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };
}

function makeEnglishToWord(
  item: QuizPool,
  allWords: string[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "english-to-word",
    prompt: translate
      ? translate("quiz.promptEnglishToWord", { english: item.english })
      : `How do you say "${item.english}"?`,
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };
}

function makeFillInTheBlank(
  item: QuizPool,
  allWords: string[],
  sentences?: SentenceTemplate[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3);
  if (distractors.length < 3) return null;

  // Try to find a sentence template that uses this word
  const template = sentences?.find(
    (s) => s.answer.toLowerCase() === item.word.toLowerCase()
  );

  const maskedSentence = template
    ? template.sentence.replace(
        new RegExp(escapeRegex(template.answer), "i"),
        "______"
      )
    : null;

  const prompt = template && maskedSentence
    ? translate
      ? translate("quiz.promptFillInBlankSentence", { sentence: maskedSentence, translation: template.englishSentence })
      : `Fill in the blank: "${maskedSentence}"\n(${template.englishSentence})`
    : translate
      ? translate("quiz.promptFillInBlankSimple", { english: item.english })
      : `Fill in the blank: ______ means "${item.english}"`;

  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "fill-in-the-blank",
    prompt,
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeListening(
  item: QuizPool,
  allEnglish: string[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  if (!item.audioSource) return null; // listening requires audio
  const distractors = pickDistractors(item.english, allEnglish, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "listening",
    prompt: translate
      ? translate("quiz.promptListening")
      : "Listen and select the correct English translation",
    correctAnswer: item.english,
    options: shuffle([item.english, ...distractors]),
    audioSource: item.audioSource,
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };
}

type Candidate = { item: QuizPool; type: QuestionType };

/**
 * Builds an interleaved list of (item, type) candidates that:
 *   - Only assigns "listening" to items that have audio
 *   - Cycles through question types evenly before repeating any type
 *   - Allows questionCount to exceed pool size by reusing items with different types
 */
function buildCandidates(pool: QuizPool[]): Candidate[] {
  const baseTypes: QuestionType[] = ["word-to-english", "english-to-word", "fill-in-the-blank"];
  const hasAudioItems = pool.filter((p) => p.audioSource);

  // Group candidates by type, shuffled independently
  const byType = new Map<QuestionType, Candidate[]>();
  for (const type of baseTypes) {
    byType.set(type, shuffle(pool).map((item) => ({ item, type })));
  }
  if (hasAudioItems.length > 0) {
    byType.set("listening", shuffle(hasAudioItems).map((item) => ({ item, type: "listening" })));
  }

  // Interleave: take one from each type bucket per round, cycling through
  // types in a freshly-shuffled order each round for even distribution.
  const typeKeys = [...byType.keys()];
  const indices = new Map(typeKeys.map((k) => [k, 0]));
  const interleaved: Candidate[] = [];

  while (true) {
    let anyAdded = false;
    for (const type of shuffle(typeKeys)) {
      const group = byType.get(type)!;
      const idx = indices.get(type)!;
      if (idx < group.length) {
        interleaved.push(group[idx]);
        indices.set(type, idx + 1);
        anyAdded = true;
      }
    }
    if (!anyAdded) break;
  }

  return interleaved;
}

export function generateQuiz(
  config: QuizConfig,
  entries: DictionaryEntry[] = [],
  sentences: SentenceTemplate[] = [],
  translate?: QuizTranslateFn
): QuizQuestion[] {
  const { category, questionCount } = config;

  let pool = gatherDictionaryPool(entries, category);

  // Deduplicate by word (case-insensitive)
  const seen = new Set<string>();
  pool = pool.filter((p) => {
    const key = p.word.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Need minimum 4 entries for distractors
  if (pool.length < 4) return [];

  const allWords = pool.map((p) => p.word);
  const allEnglish = pool.map((p) => p.english);

  // Build interleaved (item, type) candidates with type balance and audio awareness
  const candidates = buildCandidates(pool);

  // Generate question objects from the first questionCount valid candidates
  const questions: QuizQuestion[] = [];
  for (const { item, type } of candidates) {
    if (questions.length >= questionCount) break;

    let q: QuizQuestion | null = null;
    switch (type) {
      case "word-to-english":
        q = makeWordToEnglish(item, allEnglish, translate);
        break;
      case "english-to-word":
        q = makeEnglishToWord(item, allWords, translate);
        break;
      case "fill-in-the-blank":
        q = makeFillInTheBlank(item, allWords, sentences, translate);
        break;
      case "listening":
        q = makeListening(item, allEnglish, translate);
        break;
    }
    if (q) questions.push(q);
  }

  return shuffle(questions);
}

/**
 * Generates a focused 3-question mini-quiz about a single specific word.
 * The target word is always the subject; other dictionary entries supply distractors.
 */
export function generateFocusedQuiz(
  word: string,
  english: string,
  audioSource: AudioSource | undefined,
  entries: DictionaryEntry[] = [],
  translate?: QuizTranslateFn
): QuizQuestion[] {
  const pool = gatherDictionaryPool(entries);
  // Filter out the focus word itself from distractor lists
  const distWords = pool.map((p) => p.word).filter((w) => w.toLowerCase().trim() !== word.toLowerCase().trim());
  const distEnglish = pool.map((p) => p.english).filter((e) => e.toLowerCase().trim() !== english.toLowerCase().trim());

  // Need at least 3 distractors for each question
  if (distWords.length < 3 || distEnglish.length < 3) return [];

  const focus: QuizPool = { word, english, audioSource };
  const questions: QuizQuestion[] = [];

  const q1 = makeWordToEnglish(focus, distEnglish, translate);
  if (q1) questions.push(q1);

  const q2 = makeEnglishToWord(focus, distWords, translate);
  if (q2) questions.push(q2);

  // Listening if audio available, otherwise fill-in-the-blank
  if (audioSource) {
    const q3 = makeListening(focus, distEnglish, translate);
    if (q3) questions.push(q3);
  } else {
    const q3 = makeFillInTheBlank(focus, distWords, undefined, translate);
    if (q3) questions.push(q3);
  }

  return questions;
}

export function generateMatchingPairs(
  config: MatchingGameConfig,
  entries: DictionaryEntry[] = [],
  segments: TranscriptSegment[] = []
): MatchingPair[] {
  const { pairCount } = config;

  const validSegments = segments.filter(
    (s) => s.text?.trim() && s.translation?.trim()
  );

  if (validSegments.length >= 4) {
    const selected = shuffle(validSegments).slice(0, pairCount);
    return selected.map((seg, i) => ({
      id: `mp-${i}`,
      word: seg.text,
      english: seg.translation!,
    }));
  }

  const pool = gatherDictionaryPool(entries);
  if (pool.length < pairCount) return [];

  const selected = shuffle(pool).slice(0, pairCount);
  return selected.map((item, i) => ({
    id: `mp-${i}`,
    word: item.word,
    english: item.english,
  }));
}

function makeSegmentListening(
  segment: TranscriptSegment,
  allTranslations: string[],
  lessonAudioUrl: AudioSource,
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const correct = segment.translation!;
  const distractors = pickDistractors(correct, allTranslations, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "segment-listening",
    prompt: translate
      ? translate("quiz.promptListening")
      : "Listen and select the correct English translation",
    correctAnswer: correct,
    options: shuffle([correct, ...distractors]),
    audioSource: lessonAudioUrl,
    startTime: segment.startTime,
    endTime: segment.endTime,
  };
}

function makeContextTranslate(
  segment: TranscriptSegment,
  allTranslations: string[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const correct = segment.translation!;
  const distractors = pickDistractors(correct, allTranslations, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "context-translate",
    prompt: segment.text,
    correctAnswer: correct,
    options: shuffle([correct, ...distractors]),
  };
}

export function generateLessonQuiz(
  config: QuizConfig,
  segments: TranscriptSegment[],
  lessonAudioUrl: AudioSource | undefined,
  entries: DictionaryEntry[] = [],
  translate?: QuizTranslateFn
): QuizQuestion[] {
  const { questionCount } = config;

  const seen = new Set<string>();
  const validSegments = segments.filter((s) => {
    if (!s.text?.trim() || !s.translation?.trim()) return false;
    const key = s.text.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (validSegments.length < 4) {
    return generateQuiz(config, entries, undefined, translate);
  }

  const segTranslations = validSegments.map((s) => s.translation!);
  const dictEnglish = entries.map((e) => e.english);
  const allTranslations = [...new Set([...segTranslations, ...dictEnglish])];

  const shuffledSegments = shuffle(validSegments);

  const listeningQuestions: QuizQuestion[] = [];
  const contextQuestions: QuizQuestion[] = [];

  for (const seg of shuffledSegments) {
    if (lessonAudioUrl && seg.startTime !== undefined && seg.endTime !== undefined) {
      const q = makeSegmentListening(seg, allTranslations, lessonAudioUrl, translate);
      if (q) listeningQuestions.push(q);
    }
    const q = makeContextTranslate(seg, allTranslations, translate);
    if (q) contextQuestions.push(q);
  }

  return [...listeningQuestions, ...contextQuestions].slice(0, questionCount);
}
