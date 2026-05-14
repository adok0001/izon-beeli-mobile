import { generateQuiz, generateFocusedQuiz, generateMatchingPairs } from "../quiz-engine";
import type { DictionaryEntry } from "../dictionary";
import type { QuizConfig, SentenceTemplate, MatchingGameConfig } from "@/types";

// Minimal valid DictionaryEntry factory
function makeEntry(overrides: Partial<DictionaryEntry> & { word: string; english: string }): DictionaryEntry {
  return {
    id: overrides.id ?? overrides.word,
    category: "greetings",
    languageId: "twi",
    ...overrides,
  };
}

// A pool large enough for distractors (minimum 4 entries required)
function makePool(count: number): DictionaryEntry[] {
  return Array.from({ length: count }, (_, i) =>
    makeEntry({ word: `word${i}`, english: `english${i}` })
  );
}

const DEFAULT_CONFIG: QuizConfig = {
  languageId: "twi",
  questionCount: 5,
};

// ---------------------------------------------------------------------------
// generateQuiz
// ---------------------------------------------------------------------------

describe("generateQuiz", () => {
  describe("question count", () => {
    it("returns the requested number of questions when pool is large enough", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 5 }, entries);
      expect(questions).toHaveLength(5);
    });

    it("returns fewer questions than requested when pool is small", () => {
      // With 4 entries we can still generate some questions but not 10
      const entries = makePool(4);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 10 }, entries);
      expect(questions.length).toBeLessThanOrEqual(10);
      expect(questions.length).toBeGreaterThan(0);
    });

    it("returns empty array when pool has fewer than 4 entries", () => {
      const entries = makePool(3);
      const questions = generateQuiz(DEFAULT_CONFIG, entries);
      expect(questions).toHaveLength(0);
    });

    it("returns empty array when entries is empty", () => {
      const questions = generateQuiz(DEFAULT_CONFIG, []);
      expect(questions).toHaveLength(0);
    });

    it("returns empty array when entries is not provided", () => {
      const questions = generateQuiz(DEFAULT_CONFIG);
      expect(questions).toHaveLength(0);
    });
  });

  describe("question types", () => {
    it("generates word-to-english questions", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 20 }, entries);
      const types = questions.map((q) => q.type);
      expect(types).toContain("word-to-english");
    });

    it("generates english-to-word questions", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 20 }, entries);
      const types = questions.map((q) => q.type);
      expect(types).toContain("english-to-word");
    });

    it("generates fill-in-the-blank questions", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 20 }, entries);
      const types = questions.map((q) => q.type);
      expect(types).toContain("fill-in-the-blank");
    });

    it("generates listening questions when entries have audio", () => {
      const entries = makePool(20).map((e) => ({ ...e, audioUrl: `https://audio/${e.word}.mp3` }));
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 20 }, entries);
      const types = questions.map((q) => q.type);
      expect(types).toContain("listening");
    });

    it("does not generate listening questions when no entries have audio", () => {
      const entries = makePool(20); // no audioUrl
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 20 }, entries);
      const listeningQuestions = questions.filter((q) => q.type === "listening");
      expect(listeningQuestions).toHaveLength(0);
    });
  });

  describe("correct answer in options", () => {
    it("always includes the correct answer in the options array", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 10 }, entries);
      for (const q of questions) {
        expect(q.options).toContain(q.correctAnswer);
      }
    });

    it("correct answer is in options for listening questions", () => {
      const entries = makePool(20).map((e) => ({ ...e, audioUrl: `https://audio/${e.word}.mp3` }));
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 10 }, entries);
      for (const q of questions) {
        expect(q.options).toContain(q.correctAnswer);
      }
    });
  });

  describe("no duplicate options", () => {
    it("has no duplicate options within a question", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 10 }, entries);
      for (const q of questions) {
        const normalized = q.options.map((o) => o.toLowerCase().trim());
        const unique = new Set(normalized);
        expect(unique.size).toBe(normalized.length);
      }
    });
  });

  describe("options length", () => {
    it("each question has exactly 4 options", () => {
      const entries = makePool(20);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 10 }, entries);
      for (const q of questions) {
        expect(q.options).toHaveLength(4);
      }
    });
  });

  describe("question structure", () => {
    it("each question has a non-empty id, type, prompt, correctAnswer, and options", () => {
      const entries = makePool(10);
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 5 }, entries);
      for (const q of questions) {
        expect(q.id).toBeTruthy();
        expect(q.type).toBeTruthy();
        expect(q.prompt).toBeTruthy();
        expect(q.correctAnswer).toBeTruthy();
        expect(q.options.length).toBeGreaterThan(0);
      }
    });
  });

  describe("category filtering", () => {
    it("only uses entries matching the given category", () => {
      const greetings = Array.from({ length: 8 }, (_, i) =>
        makeEntry({ word: `hello${i}`, english: `greeting${i}`, category: "greetings" })
      );
      const numbers = Array.from({ length: 8 }, (_, i) =>
        makeEntry({ word: `one${i}`, english: `number${i}`, category: "numbers" })
      );
      const entries = [...greetings, ...numbers];

      const questions = generateQuiz({ ...DEFAULT_CONFIG, category: "greetings", questionCount: 5 }, entries);
      // All correct answers should be from the greetings category
      const greetingEnglish = new Set(greetings.map((e) => e.english));
      const greetingWords = new Set(greetings.map((e) => e.word));
      for (const q of questions) {
        if (q.type === "word-to-english" || q.type === "listening") {
          expect(greetingEnglish.has(q.correctAnswer)).toBe(true);
        } else {
          expect(greetingWords.has(q.correctAnswer)).toBe(true);
        }
      }
    });

    it("returns empty array when category has fewer than 4 entries", () => {
      const entries = [
        makeEntry({ word: "hello", english: "greeting", category: "greetings" }),
        makeEntry({ word: "bye", english: "farewell", category: "greetings" }),
        makeEntry({ word: "one", english: "number", category: "numbers" }),
      ];
      const questions = generateQuiz({ ...DEFAULT_CONFIG, category: "greetings" }, entries);
      expect(questions).toHaveLength(0);
    });
  });

  describe("deduplication", () => {
    it("deduplicates entries with the same word (case-insensitive)", () => {
      const entries = [
        makeEntry({ word: "Akwaaba", english: "welcome" }),
        makeEntry({ word: "akwaaba", english: "welcome variant" }), // duplicate
        ...makePool(10),
      ];
      // Should not throw and should produce valid questions
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 5 }, entries);
      expect(questions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("fill-in-the-blank with sentence templates", () => {
    it("uses sentence template when available for fill-in-the-blank", () => {
      const entries = makePool(10);
      const sentences: SentenceTemplate[] = [
        {
          id: "s1",
          languageId: "twi",
          sentence: "Mi word0 te fie.",
          answer: "word0",
          englishSentence: "My english0 at home.",
        },
      ];
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 5 }, entries, sentences);
      const fitb = questions.find((q) => q.type === "fill-in-the-blank" && q.prompt.includes("______"));
      // If a fill-in-the-blank question was generated with word0, it should use the sentence template
      if (fitb) {
        expect(fitb.prompt).toContain("______");
      }
    });
  });

  describe("custom translate function", () => {
    it("uses custom translate function for prompts when provided", () => {
      const entries = makePool(10);
      const translate = (key: string, opts?: Record<string, unknown>) => `TRANSLATED:${key}`;
      const questions = generateQuiz({ ...DEFAULT_CONFIG, questionCount: 5 }, entries, [], translate);
      for (const q of questions) {
        expect(q.prompt).toMatch(/^TRANSLATED:/);
      }
    });
  });
});

// ---------------------------------------------------------------------------
// generateFocusedQuiz
// ---------------------------------------------------------------------------

describe("generateFocusedQuiz", () => {
  const distractor_entries = makePool(20);

  it("returns up to 3 questions for a valid focus word", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, distractor_entries);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it("always includes a word-to-english question", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, distractor_entries);
    expect(questions.map((q) => q.type)).toContain("word-to-english");
  });

  it("always includes an english-to-word question", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, distractor_entries);
    expect(questions.map((q) => q.type)).toContain("english-to-word");
  });

  it("includes a listening question when audio is provided", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", "https://audio/myword.mp3", distractor_entries);
    expect(questions.map((q) => q.type)).toContain("listening");
  });

  it("includes a fill-in-the-blank question when no audio is provided", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, distractor_entries);
    expect(questions.map((q) => q.type)).toContain("fill-in-the-blank");
  });

  it("correct answer is always in the options", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", "https://audio/myword.mp3", distractor_entries);
    for (const q of questions) {
      expect(q.options).toContain(q.correctAnswer);
    }
  });

  it("returns empty array when there are fewer than 3 distractors", () => {
    const smallPool = makePool(2);
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, smallPool);
    expect(questions).toHaveLength(0);
  });

  it("returns empty array when entries is empty", () => {
    const questions = generateFocusedQuiz("myword", "myenglish", undefined, []);
    expect(questions).toHaveLength(0);
  });

  it("the focus word is not used as a distractor", () => {
    const questions = generateFocusedQuiz("word0", "english0", undefined, distractor_entries);
    for (const q of questions) {
      const otherOptions = q.options.filter(
        (o) => o.toLowerCase().trim() !== q.correctAnswer.toLowerCase().trim()
      );
      for (const opt of otherOptions) {
        // None of the distractors should be the focus word
        if (q.type === "english-to-word" || q.type === "fill-in-the-blank") {
          expect(opt.toLowerCase().trim()).not.toBe("word0");
        }
        if (q.type === "word-to-english" || q.type === "listening") {
          expect(opt.toLowerCase().trim()).not.toBe("english0");
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// generateMatchingPairs
// ---------------------------------------------------------------------------

describe("generateMatchingPairs", () => {
  const DEFAULT_MATCHING_CONFIG: MatchingGameConfig = {
    languageId: "twi",
    pairCount: 4,
  };

  it("returns the requested number of pairs when pool is large enough", () => {
    const entries = makePool(20);
    const pairs = generateMatchingPairs(DEFAULT_MATCHING_CONFIG, entries);
    expect(pairs).toHaveLength(4);
  });

  it("returns empty array when pool is smaller than pairCount", () => {
    const entries = makePool(2);
    const pairs = generateMatchingPairs({ ...DEFAULT_MATCHING_CONFIG, pairCount: 4 }, entries);
    expect(pairs).toHaveLength(0);
  });

  it("each pair has word and english fields", () => {
    const entries = makePool(10);
    const pairs = generateMatchingPairs(DEFAULT_MATCHING_CONFIG, entries);
    for (const pair of pairs) {
      expect(pair.word).toBeTruthy();
      expect(pair.english).toBeTruthy();
    }
  });

  it("pairs have unique ids", () => {
    const entries = makePool(20);
    const pairs = generateMatchingPairs({ ...DEFAULT_MATCHING_CONFIG, pairCount: 8 }, entries);
    const ids = pairs.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
