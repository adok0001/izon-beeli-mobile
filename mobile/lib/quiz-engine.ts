import type { DictionaryEntry } from "@/lib/dictionary";
import type { AudioSource, MatchingGameConfig, MatchingPair, QuestionType, QuizConfig, QuizQuestion, SentenceTemplate } from "@/types";

/** Optional translate function passed from a React component via useTranslation(). */
export type QuizTranslateFn = (key: string, opts?: Record<string, unknown>) => string;

interface QuizPool {
  word: string;
  english: string;
  category?: string;
  audioSource?: AudioSource;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  correct: string,
  pool: string[],
  count: number
): string[] {
  const candidates = pool.filter((s) => s !== correct);
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
  const distractors = pickDistractors(item.english, allEnglish, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "listening",
    prompt: item.audioSource
      ? translate
        ? translate("quiz.promptListening")
        : "Listen and select the correct English translation"
      : translate
        ? translate("quiz.promptTranslationOf", { word: item.word })
        : `What is the English translation of: "${item.word}"?`,
    correctAnswer: item.english,
    options: shuffle([item.english, ...distractors]),
    audioSource: item.audioSource,
  };
}

export function generateQuiz(
  config: QuizConfig,
  entries: DictionaryEntry[] = [],
  sentences: SentenceTemplate[] = [],
  translate?: QuizTranslateFn
): QuizQuestion[] {
  const { category, questionCount } = config;

  let pool = gatherDictionaryPool(entries, category);

  // Deduplicate by word
  const seen = new Set<string>();
  pool = pool.filter((p) => {
    const key = p.word.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Need minimum 4 entries for distractors
  if (pool.length < 4) return [];

  const allWords = pool.map((p) => p.word);
  const allEnglish = pool.map((p) => p.english);

  const shuffledPool = shuffle(pool);
  const questions: QuizQuestion[] = [];
  const types: QuestionType[] = [
    "word-to-english",
    "english-to-word",
    "fill-in-the-blank",
    "listening",
  ];

  // Distribute question types evenly across the pool
  for (let i = 0; i < shuffledPool.length && questions.length < questionCount; i++) {
    const item = shuffledPool[i];
    const typeIndex = i % types.length;

    let q: QuizQuestion | null = null;
    switch (typeIndex) {
      case 0:
        q = makeWordToEnglish(item, allEnglish, translate);
        break;
      case 1:
        q = makeEnglishToWord(item, allWords, translate);
        break;
      case 2:
        q = makeFillInTheBlank(item, allWords, sentences, translate);
        break;
      case 3:
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
  const distWords = pool.map((p) => p.word).filter((w) => w !== word);
  const distEnglish = pool.map((p) => p.english).filter((e) => e !== english);

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
  entries: DictionaryEntry[] = []
): MatchingPair[] {
  const { pairCount } = config;
  const pool = gatherDictionaryPool(entries);
  if (pool.length < pairCount) return [];

  const selected = shuffle(pool).slice(0, pairCount);
  return selected.map((item, i) => ({
    id: `mp-${i}`,
    word: item.word,
    english: item.english,
  }));
}
