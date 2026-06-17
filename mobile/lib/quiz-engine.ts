import type { DictionaryEntry } from "@/lib/dictionary";
import { localize } from "@/lib/localize";
import type { AudioSource, MatchingGameConfig, MatchingPair, QuestionType, QuizConfig, QuizQuestion, SentenceTemplate, TranscriptSegment } from "@/types";

/** Optional translate function passed from a React component via useTranslation(). */
export type QuizTranslateFn = (key: string, opts?: Record<string, unknown>) => string;

interface QuizPool {
  id: string;
  word: string;
  english: string;
  category?: string;
  audioSource?: AudioSource;
  example?: string;
  exampleTranslation?: string;
  exampleAudioUrl?: string;
  imageUrl?: string;
  /** Leitner box (1–5). Used for weighted sampling; 1 = new/struggling. */
  box?: number;
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
 * Prefers `preferred` (e.g. same-category items) before falling back to the full pool.
 * Rejects candidates whose normalised tokens overlap with the correct answer to avoid
 * synonym ambiguity — falls back to overlapping candidates if needed to fill slots.
 * Deduplicates case-insensitively so "Run" and "run" don't both appear.
 */
function pickDistractors(
  correct: string,
  pool: string[],
  count: number,
  preferred?: string[]
): string[] {
  const correctNorm = correct.toLowerCase().trim();
  const correctTokens = new Set(
    correctNorm.split(/\s+/).filter((t) => t.length > 2)
  );

  function hasTokenOverlap(s: string): boolean {
    if (correctTokens.size === 0) return false;
    return s.toLowerCase().trim().split(/\s+/).some((t) => t.length > 2 && correctTokens.has(t));
  }

  const seen = new Set<string>([correctNorm]);
  const result: string[] = [];

  for (const source of [preferred ?? [], pool]) {
    for (const s of shuffle(source)) {
      if (result.length >= count) break;
      const norm = s.toLowerCase().trim();
      if (!seen.has(norm) && !hasTokenOverlap(s)) {
        seen.add(norm);
        result.push(s);
      }
    }
  }

  // Relax overlap filter using only the full pool to fill remaining slots
  if (result.length < count) {
    for (const s of shuffle(pool)) {
      if (result.length >= count) break;
      const norm = s.toLowerCase().trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        result.push(s);
      }
    }
  }

  return result;
}

function gatherDictionaryPool(
  entries: DictionaryEntry[],
  category?: string,
  wordProgress?: Map<string, number>
): QuizPool[] {
  const filtered = category
    ? entries.filter((e) => e.category === category)
    : entries;

  return filtered.map((e) => ({
    id: e.id,
    word: e.word,
    english: localize(e.english, "en"),
    category: e.category,
    audioSource: (e as any).audioUrl,
    example: e.example,
    exampleTranslation: localize(e.exampleTranslation, "en") || undefined,
    exampleAudioUrl: e.exampleAudioUrl ?? undefined,
    imageUrl: e.imageUrl ?? undefined,
    box: wordProgress?.get(e.id) ?? 1,
  }));
}

/**
 * Weighted sampling: lower Leitner boxes and unseen words get higher weight.
 * Box weights: 1→5, 2→4, 3→3, 4→2, 5→1
 */
function weightedSample(pool: QuizPool[], count: number): QuizPool[] {
  if (pool.length <= count) return [...pool];
  const boxWeight = (box: number) => Math.max(6 - box, 1);
  const weights = pool.map((p) => boxWeight(p.box ?? 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const result: QuizPool[] = [];
  const used = new Set<number>();
  while (result.length < count && used.size < pool.length) {
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      if (used.has(i)) continue;
      r -= weights[i];
      if (r <= 0) {
        result.push(pool[i]);
        used.add(i);
        break;
      }
    }
  }
  return result;
}

function makeWordToEnglish(
  item: QuizPool,
  allEnglish: string[],
  translate?: QuizTranslateFn,
  preferredEnglish?: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.english, allEnglish, 3, preferredEnglish);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "word-to-english",
    wordId: item.id,
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
  translate?: QuizTranslateFn,
  preferredWords?: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3, preferredWords);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "english-to-word",
    wordId: item.id,
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
  translate?: QuizTranslateFn,
  preferredWords?: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3, preferredWords);
  if (distractors.length < 3) return null;

  const template = sentences?.find(
    (s) => s.answer.toLowerCase() === item.word.toLowerCase()
  );

  const base = {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    wordId: item.id,
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };

  if (template) {
    // Explicit kind takes precedence; substring guard acts as safety net when kind is absent/blank
    const isEquivalent =
      template.kind === "equivalent" ||
      (!template.kind || template.kind === "blank") &&
        !template.sentence.toLowerCase().includes(template.answer.toLowerCase());

    if (isEquivalent) {
      const gloss = template.literalTranslation
        ? ` (lit. "${template.literalTranslation}")`
        : "";
      const prompt = translate
        ? translate("quiz.promptEquivalence", { sentence: template.sentence, translation: template.englishSentence })
        : `Which word means the same as "${template.sentence}"${gloss}?\n(${template.englishSentence})`;
      return { ...base, type: "equivalence" as const, prompt };
    }

    const maskedSentence = template.sentence.replace(
      new RegExp(escapeRegex(template.answer), "i"),
      "______"
    );
    const prompt = translate
      ? translate("quiz.promptFillInBlankSentence", { sentence: maskedSentence, translation: template.englishSentence })
      : `Fill in the blank: "${maskedSentence}"\n(${template.englishSentence})`;
    return { ...base, type: "fill-in-the-blank" as const, prompt };
  }

  const prompt = translate
    ? translate("quiz.promptFillInBlankSimple", { english: item.english })
    : `Fill in the blank: ______ means "${item.english}"`;
  return { ...base, type: "fill-in-the-blank" as const, prompt };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function makeListening(
  item: QuizPool,
  allEnglish: string[],
  translate?: QuizTranslateFn,
  preferredEnglish?: string[]
): QuizQuestion | null {
  if (!item.audioSource) return null; // listening requires audio
  const distractors = pickDistractors(item.english, allEnglish, 3, preferredEnglish);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "listening",
    wordId: item.id,
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

function makeSentenceTranslate(
  template: SentenceTemplate,
  allEnglish: string[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  const englishSentence = localize(template.englishSentence, "en");
  const distractors = pickDistractors(englishSentence, allEnglish, 3);
  if (distractors.length < 3) return null;
  const prompt = translate
    ? translate("quiz.promptSentenceTranslate", { sentence: template.sentence })
    : `Translate: "${template.sentence}"`;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "sentence-translate",
    prompt,
    correctAnswer: englishSentence,
    options: shuffle([englishSentence, ...distractors]),
    exampleAudioUrl: (template as any).exampleAudioUrl ?? undefined,
  };
}

function makePictureToWord(
  item: QuizPool,
  allWords: string[],
  translate?: QuizTranslateFn,
  preferredWords?: string[]
): QuizQuestion | null {
  if (!item.imageUrl) return null;
  const distractors = pickDistractors(item.word, allWords, 3, preferredWords);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "picture-to-word",
    wordId: item.id,
    imageUrl: item.imageUrl,
    prompt: translate
      ? translate("quiz.promptPictureToWord")
      : "What word does this picture show?",
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
    exampleSentence: item.example,
    exampleSentenceTranslation: item.exampleTranslation,
  };
}

function makeWordToPicture(
  item: QuizPool,
  pool: QuizPool[],
  translate?: QuizTranslateFn
): QuizQuestion | null {
  if (!item.imageUrl) return null;
  // Need 3 other items that also have images for the 2×2 grid
  const otherImgItems = shuffle(pool.filter((p) => p.id !== item.id && !!p.imageUrl)).slice(0, 3);
  if (otherImgItems.length < 3) return null;
  const allOptions = shuffle([item, ...otherImgItems]);
  const optionImages: Record<string, string> = {};
  for (const opt of allOptions) {
    optionImages[opt.word] = opt.imageUrl!;
  }
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "word-to-picture",
    wordId: item.id,
    prompt: translate
      ? translate("quiz.promptWordToPicture", { word: item.word })
      : `Which picture shows "${item.word}"?`,
    correctAnswer: item.word,
    options: allOptions.map((o) => o.word),
    optionImages,
  };
}

function makeTypeTheWord(
  item: QuizPool,
  translate?: QuizTranslateFn
): QuizQuestion | null {
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "type-the-word",
    wordId: item.id,
    prompt: translate
      ? translate("quiz.promptTypeTheWord", { english: item.english })
      : `Type the word for "${item.english}"`,
    correctAnswer: item.word,
    options: [],
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
function buildCandidates(pool: QuizPool[], wordProgressMap?: Map<string, number>): Candidate[] {
  const baseTypes: QuestionType[] = ["word-to-english", "english-to-word", "fill-in-the-blank"];
  const hasAudioItems = pool.filter((p) => p.audioSource);
  const hasImageItems = pool.filter((p) => p.imageUrl);

  // Group candidates by type, shuffled independently
  const byType = new Map<QuestionType, Candidate[]>();
  for (const type of baseTypes) {
    byType.set(type, shuffle(pool).map((item) => ({ item, type })));
  }
  if (hasAudioItems.length > 0) {
    byType.set("listening", shuffle(hasAudioItems).map((item) => ({ item, type: "listening" })));
  }
  if (hasImageItems.length >= 4) {
    byType.set("picture-to-word", shuffle(hasImageItems).map((item) => ({ item, type: "picture-to-word" })));
    byType.set("word-to-picture", shuffle(hasImageItems).map((item) => ({ item, type: "word-to-picture" })));
  }
  // type-the-word: only for box ≥ 4 items (higher Leitner mastery)
  if (wordProgressMap) {
    const advancedItems = pool.filter((p) => (wordProgressMap.get(p.id) ?? 1) >= 4);
    if (advancedItems.length > 0) {
      byType.set("type-the-word", shuffle(advancedItems).map((item) => ({ item, type: "type-the-word" })));
    }
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
  translate?: QuizTranslateFn,
  wordProgressMap?: Map<string, number>
): QuizQuestion[] {
  const { category, questionCount } = config;

  let pool = gatherDictionaryPool(entries, category, wordProgressMap);

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

  // When word progress is available, bias the pool toward overdue/low-box words
  const sampledPool = wordProgressMap ? weightedSample(pool, Math.min(pool.length, questionCount * 3)) : pool;

  // Build interleaved (item, type) candidates with type balance and audio/image awareness
  const candidates = buildCandidates(sampledPool, wordProgressMap);

  // Reserve up to 25% of slots for sentence-translate questions (only when templates exist)
  const sentenceSlots = sentences.length > 0 ? Math.max(0, Math.floor(questionCount / 4)) : 0;
  const wordSlots = questionCount - sentenceSlots;

  // Pre-build category → { words, english } map for O(1) preferred-distractor lookup
  const catMap = new Map<string, { words: string[]; english: string[] }>();
  for (const p of pool) {
    if (!p.category) continue;
    let bucket = catMap.get(p.category);
    if (!bucket) { bucket = { words: [], english: [] }; catMap.set(p.category, bucket); }
    bucket.words.push(p.word);
    bucket.english.push(p.english);
  }

  const questions: QuizQuestion[] = [];
  for (const { item, type } of candidates) {
    if (questions.length >= wordSlots) break;

    const catBucket = item.category ? catMap.get(item.category) : undefined;
    const preferredWords = catBucket?.words.filter((w) => w !== item.word) ?? [];
    const preferredEnglish = catBucket?.english.filter((e) => e !== item.english) ?? [];

    let q: QuizQuestion | null = null;
    switch (type) {
      case "word-to-english":
        q = makeWordToEnglish(item, allEnglish, translate, preferredEnglish);
        break;
      case "english-to-word":
        q = makeEnglishToWord(item, allWords, translate, preferredWords);
        break;
      case "fill-in-the-blank":
        q = makeFillInTheBlank(item, allWords, sentences, translate, preferredWords);
        break;
      case "listening":
        q = makeListening(item, allEnglish, translate, preferredEnglish);
        break;
      case "picture-to-word":
        q = makePictureToWord(item, allWords, translate, preferredWords);
        break;
      case "word-to-picture":
        q = makeWordToPicture(item, sampledPool, translate);
        break;
      case "type-the-word":
        q = makeTypeTheWord(item, translate);
        break;
    }
    if (q) questions.push(q);
  }

  // Mix in sentence-translate questions from templates
  if (sentences.length > 0 && sentenceSlots > 0) {
    const allEnglishSentences = sentences.map((s) => localize(s.englishSentence, "en"));
    for (const template of shuffle(sentences)) {
      if (questions.length >= questionCount) break;
      const q = makeSentenceTranslate(template, allEnglishSentences, translate);
      if (q) questions.push(q);
    }
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

  const focus: QuizPool = { id: "", word, english, audioSource };
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
    (s) => s.text?.trim() && localize(s.translation, "en").trim()
  );

  if (validSegments.length >= 4) {
    const selected = shuffle(validSegments).slice(0, pairCount);
    return selected.map((seg, i) => ({
      id: `mp-${i}`,
      word: seg.text,
      english: localize(seg.translation, "en"),
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
  const correct = localize(segment.translation, "en");
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
  const correct = localize(segment.translation, "en");
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
    if (!s.text?.trim() || !localize(s.translation, "en").trim()) return false;
    const key = s.text.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (validSegments.length < 4) {
    return generateQuiz(config, entries, undefined, translate);
  }

  const segTranslations = validSegments.map((s) => localize(s.translation, "en"));
  const dictEnglish = entries.map((e) => localize(e.english, "en"));
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
