import type { QuestionType, QuizConfig, QuizQuestion } from "@/types";
import type { DictionaryEntry } from "@/lib/dictionary";
import { getDictionaryForLanguage } from "@/lib/data";
import { LESSONS, COURSES, getLessonsByCourse } from "@/lib/mock-data";
import type { TranscriptSegment } from "@/types";

interface QuizPool {
  word: string;
  english: string;
  category?: string;
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
  languageId: string,
  additionalEntries: DictionaryEntry[],
  category?: string
): QuizPool[] {
  const local = getDictionaryForLanguage(languageId);
  const all = [...local, ...additionalEntries].filter(
    (e) => e.languageId === languageId
  );

  const filtered = category
    ? all.filter((e) => e.category === category)
    : all;

  return filtered.map((e) => ({
    word: e.word,
    english: e.english,
    category: e.category,
  }));
}

function gatherTranscriptPool(courseId: string): QuizPool[] {
  const lessons = getLessonsByCourse(courseId);
  const segments: TranscriptSegment[] = [];
  for (const lesson of lessons) {
    if (lesson.transcript) {
      segments.push(...lesson.transcript);
    }
  }
  return segments
    .filter((s) => s.translation)
    .map((s) => ({
      word: s.text,
      english: s.translation!,
    }));
}

function makeWordToEnglish(
  item: QuizPool,
  allEnglish: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.english, allEnglish, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "word-to-english",
    prompt: `What does "${item.word}" mean in English?`,
    correctAnswer: item.english,
    options: shuffle([item.english, ...distractors]),
  };
}

function makeEnglishToWord(
  item: QuizPool,
  allWords: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "english-to-word",
    prompt: `How do you say "${item.english}"?`,
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
  };
}

function makeFillInTheBlank(
  item: QuizPool,
  allWords: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.word, allWords, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "fill-in-the-blank",
    prompt: `Fill in the blank: ______ means "${item.english}"`,
    correctAnswer: item.word,
    options: shuffle([item.word, ...distractors]),
  };
}

function makeListening(
  item: QuizPool,
  allEnglish: string[]
): QuizQuestion | null {
  const distractors = pickDistractors(item.english, allEnglish, 3);
  if (distractors.length < 3) return null;
  return {
    id: `q-${Math.random().toString(36).slice(2, 9)}`,
    type: "listening",
    prompt: `What is the English translation of: "${item.word}"?`,
    correctAnswer: item.english,
    options: shuffle([item.english, ...distractors]),
  };
}

const QUESTION_MAKERS = [
  makeWordToEnglish,
  makeEnglishToWord,
  makeFillInTheBlank,
  makeListening,
] as const;

export function generateQuiz(
  config: QuizConfig,
  additionalEntries: DictionaryEntry[] = []
): QuizQuestion[] {
  const { languageId, courseId, category, questionCount } = config;

  // Build pool
  let pool: QuizPool[] = [];

  // Dictionary entries
  const dictPool = gatherDictionaryPool(
    languageId,
    additionalEntries,
    category
  );
  pool.push(...dictPool);

  // Transcript entries (if courseId provided)
  if (courseId) {
    const transcriptPool = gatherTranscriptPool(courseId);
    pool.push(...transcriptPool);
  }

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
    const makers = [
      [makeWordToEnglish, allEnglish],
      [makeEnglishToWord, allWords],
      [makeFillInTheBlank, allWords],
      [makeListening, allEnglish],
    ] as const;

    const [maker, distPool] = makers[typeIndex];
    const q = maker(item, distPool as string[]);
    if (q) questions.push(q);
  }

  return shuffle(questions);
}
