import {
  buildCheckpointRound,
  isCorrectAnswer,
  type CheckpointLessonSource,
  type CheckpointQuestion,
} from "../checkpoint-rounds";
import type { DictionaryEntry } from "../dictionary";

/** Deterministic RNG so interleave order and distractor picks are reproducible. */
function seededRng(seed = 1): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function lessonSource(id: string, words: number, segments: number, withAudio = true): CheckpointLessonSource {
  return {
    id,
    audioUrl: withAudio ? `https://example.test/${id}.mp3` : undefined,
    vocab: Array.from({ length: words }, (_, i) => ({
      text: `${id}-word${i}`,
      translation: `${id} meaning ${i}`,
    })),
    transcript: Array.from({ length: segments }, (_, i) => ({
      id: `${id}-s${i}`,
      startTime: i * 3,
      endTime: i * 3 + 3,
      text: `${id} alpha bravo charlie ${i}`,
      translation: `${id} sentence ${i}`,
    })),
  };
}

const RICH = [
  lessonSource("l1", 4, 3),
  lessonSource("l2", 4, 3),
  lessonSource("l3", 4, 3),
  lessonSource("l4", 4, 3),
  lessonSource("l5", 4, 3),
];

function dictEntry(word: string, english: string): DictionaryEntry {
  return { id: `d-${word}`, word, english, category: "greetings", languageId: "izon" } as DictionaryEntry;
}

/** Words that appear in RICH's transcripts ("alpha bravo charlie"), plus one that doesn't. */
const DICT: DictionaryEntry[] = [
  dictEntry("alpha", "first"),
  dictEntry("bravo", "second"),
  dictEntry("charlie", "third"),
  dictEntry("delta", "fourth"),
  dictEntry("echo", "fifth"),
  dictEntry("l1", "lesson one"),
  dictEntry("unrelated", "not in any lesson"),
];

/**
 * Movement 1 ships 80 live lines whose text is still `[[NEEDS IZON]]`, and one
 * whose translation carries a `⚠ TONE REQUIRED` note. Both have real English
 * attached, so nothing based on non-emptiness filters them out.
 */
describe("unfinished content", () => {
  const unfinished: CheckpointLessonSource = {
    id: "u1",
    audioUrl: "https://example.test/u1.mp3",
    vocab: [{ text: "[[NEEDS IZON]]", translation: "welcome" }],
    transcript: [
      { id: "u1-s0", startTime: 0, endTime: 3, text: "[[NEEDS IZON]]", translation: "I do not understand" },
      { id: "u1-s1", startTime: 3, endTime: 6, text: "Eniyai", translation: "ours  ⚠ TONE REQUIRED — written form is person-ambiguous" },
      { id: "u1-s2", startTime: 6, endTime: 9, text: "Doo bra mi", translation: "good morning" },
    ],
  };

  const round = buildCheckpointRound(
    [unfinished, ...RICH],
    "recall",
    [dictEntry("izon", "the language"), dictEntry("doo", "good")],
    20,
    seededRng(7)
  );
  const surfaced = round.flatMap((q) =>
    q.kind === "choice" ? [q.prompt, q.correct, ...q.options] : [q.prompt, ...q.tokens]
  );

  it("never shows a placeholder to the learner", () => {
    expect(surfaced.some((s) => s.includes("[["))).toBe(false);
  });

  it("never shows a review marker to the learner", () => {
    expect(surfaced.some((s) => s.includes("⚠"))).toBe(false);
  });

  it("does not build word questions out of a tone-flagged line", () => {
    // `Eniyai` is real Ịzọn, so only the ⚠ on its translation says the written
    // form doesn't distinguish "ours" from "yours". Left in the word map it
    // becomes a recall question asserting one reading of exactly the ambiguity
    // the marker exists to flag.
    const round = buildCheckpointRound(
      [unfinished, ...RICH],
      "recall",
      [dictEntry("eniyai", "ours")],
      20,
      seededRng(7)
    );
    const shown = round.flatMap((q) =>
      q.kind === "choice" ? [q.prompt, q.correct, ...q.options] : [q.prompt, ...q.tokens]
    );
    expect(shown).not.toContain("Eniyai");
    expect(shown).not.toContain("ours");
  });

  it("still asks about the finished lines in the same lesson", () => {
    expect(surfaced).toContain("good morning");
  });
});

/**
 * The block-closing game row carries words held back from every transcript on
 * purpose — Movement 1's Endi-areama fish names and the `sịlị … akpa` money
 * scale — because a long word list drills well as a game but reads as a
 * wordbank dump inside a dialogue.
 */
describe("game row vocabulary", () => {
  const gameRow: CheckpointLessonSource = {
    id: "m1-g06",
    type: "game",
    transcript: [
      { id: "g-0", startTime: 0, endTime: 0, text: "sịka", translation: "stingray" },
      { id: "g-1", startTime: 0, endTime: 0, text: "oma", translation: "electric fish" },
      { id: "g-2", startTime: 0, endTime: 0, text: "okii", translation: "saw fish" },
      { id: "g-3", startTime: 0, endTime: 0, text: "emein", translation: "sea cow; manatee" },
    ],
  };

  const round = buildCheckpointRound([...RICH, gameRow], "recall", [], 20, seededRng(11));
  const shown = round.flatMap((q) =>
    q.kind === "choice" ? [q.prompt, q.correct, ...q.options] : [q.prompt, ...q.tokens]
  );

  it("asks about words that appear in no transcript", () => {
    // No dictionary is passed, so the transcript intersection cannot reach
    // these — the game row is the only way in.
    expect(shown).toContain("stingray");
    expect(shown).toContain("sịka");
  });

  it("attributes them to the game row", () => {
    const fromGame = round.filter((q) => q.lessonId === "m1-g06");
    expect(fromGame.length).toBeGreaterThan(0);
  });

  it("leads with a word format so the authored list is actually drilled", () => {
    // The rotation hands this gate `build`, which would spend five of eight
    // questions ordering transcript lines and touch the word list about once —
    // not the job a list held out of every transcript exists to do.
    const led = buildCheckpointRound([...RICH, gameRow], "build", [], 8, seededRng(5));
    expect(["recall", "match"]).toContain(led[0].format);
    const fromGame = led.filter((q) => q.lessonId === "m1-g06").length;
    expect(fromGame).toBeGreaterThan(1);
  });

  it("leaves the lead alone for a block with no authored list", () => {
    const round = buildCheckpointRound(RICH, "build", [], 8, seededRng(5));
    expect(round[0].format).toBe("build");
  });

  it("never asks a learner to reorder a one-word entry", () => {
    // Game entries are words, not lines; a build question over them would be
    // a sentence-ordering task with no sentence.
    const built = round.filter((q) => q.kind === "order" && q.lessonId === "m1-g06");
    expect(built).toHaveLength(0);
  });
});

describe("lead format", () => {
  it("falls forward when the covered lessons cannot support the requested lead", () => {
    // No lesson in Movement 1 carries audio, so a gate the rotation hands
    // `listen` has an empty lead pool. It must lead with something real rather
    // than announce a format it never asks.
    const silent = RICH.map((l) => ({ ...l, audioUrl: undefined }));
    const round = buildCheckpointRound(silent, "listen", [], 8, seededRng(3));
    expect(round.length).toBeGreaterThan(0);
    expect(round.some((q) => q.format === "listen")).toBe(false);
    // The lead takes the largest share, so the first question names the format
    // the round actually runs.
    const leadCount = round.filter((q) => q.format === round[0].format).length;
    expect(leadCount).toBeGreaterThanOrEqual(round.length / 2);
  });

  it("keeps the requested lead when the pool supports it", () => {
    const round = buildCheckpointRound(RICH, "listen", [], 8, seededRng(3));
    expect(round[0].format).toBe("listen");
  });
});

describe("buildCheckpointRound", () => {
  it("builds the requested number of questions from rich lessons", () => {
    const round = buildCheckpointRound(RICH, "recall", DICT, 8, seededRng());
    expect(round).toHaveLength(8);
  });

  it("interleaves rather than running one format straight through", () => {
    const round = buildCheckpointRound(RICH, "recall", DICT, 8, seededRng());
    const formats = new Set(round.map((q) => q.format));
    expect(formats.size).toBeGreaterThan(1);
  });

  it("gives the lead format the largest share", () => {
    const round = buildCheckpointRound(RICH, "listen", DICT, 8, seededRng());
    const counts = round.reduce<Record<string, number>>((acc, q) => {
      acc[q.format] = (acc[q.format] ?? 0) + 1;
      return acc;
    }, {});
    const lead = counts.listen ?? 0;
    expect(lead).toBeGreaterThanOrEqual(Math.max(...Object.values(counts)));
  });

  it("only draws on the lessons the checkpoint covers", () => {
    const round = buildCheckpointRound(RICH, "recall", DICT, 8, seededRng());
    const covered = new Set(RICH.map((l) => l.id));
    for (const q of round) expect(covered.has(q.lessonId)).toBe(true);
  });

  it("gives every choice question four distinct options including the answer", () => {
    const round = buildCheckpointRound(RICH, "recall", DICT, 8, seededRng());
    for (const q of round) {
      if (q.kind !== "choice") continue;
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options).size).toBe(4);
      expect(q.options).toContain(q.correct);
    }
  });

  it("attaches a playable segment to every listening question and no text prompt", () => {
    const round = buildCheckpointRound(RICH, "listen", DICT, 8, seededRng());
    const listening = round.filter((q) => q.format === "listen");
    expect(listening.length).toBeGreaterThan(0);
    for (const q of listening) {
      expect(q.kind).toBe("choice");
      if (q.kind !== "choice") continue;
      expect(q.audio?.source).toBeTruthy();
      expect(q.prompt).toBe("");
    }
  });

  it("never emits a listening question for lessons without audio", () => {
    const silent = RICH.map((l) => ({ ...l, audioUrl: undefined }));
    const round = buildCheckpointRound(silent, "listen", DICT, 8, seededRng());
    expect(round.every((q) => q.format !== "listen")).toBe(true);
  });

  it("never emits an order question pre-solved", () => {
    const round = buildCheckpointRound(RICH, "build", DICT, 8, seededRng());
    const ordering = round.filter((q) => q.kind === "order");
    expect(ordering.length).toBeGreaterThan(0);
    for (const q of ordering) {
      if (q.kind !== "order") continue;
      expect(q.tokens.join(" ")).not.toBe(q.correct.join(" "));
      expect([...q.tokens].sort()).toEqual([...q.correct].sort());
    }
  });

  it("returns an empty round rather than an unfair one when lessons are too thin", () => {
    const thin = [{ id: "l1", vocab: [{ text: "one", translation: "uno" }] }];
    expect(buildCheckpointRound(thin, "recall", [], 8, seededRng())).toEqual([]);
  });

  it("returns what it can when the pool is smaller than the requested count", () => {
    const small = [lessonSource("l1", 4, 0, false)];
    const round = buildCheckpointRound(small, "recall", [], 8, seededRng());
    expect(round.length).toBeGreaterThan(0);
    expect(round.length).toBeLessThanOrEqual(8);
  });

  it("does not repeat a question within a round", () => {
    const round = buildCheckpointRound(RICH, "recall", DICT, 8, seededRng());
    expect(new Set(round.map((q) => q.id)).size).toBe(round.length);
  });

  it("skips vocab entries missing a word or a meaning", () => {
    const messy: CheckpointLessonSource[] = [
      {
        id: "l1",
        vocab: [
          { text: "  ", translation: "blank word" },
          { text: "no-meaning", translation: "" },
          ...Array.from({ length: 4 }, (_, i) => ({ text: `ok${i}`, translation: `meaning ${i}` })),
        ],
      },
    ];
    const round = buildCheckpointRound(messy, "recall", [], 8, seededRng());
    for (const q of round) {
      if (q.kind !== "choice") continue;
      expect(q.prompt.trim()).not.toBe("");
      expect(q.correct.trim()).not.toBe("");
    }
  });

  // The API doesn't serve lesson `vocab`, so in production the word formats are
  // built entirely from this intersection. If it breaks, half the round dies
  // silently and gates start auto-waiving.
  describe("dictionary intersection", () => {
    const transcriptOnly: CheckpointLessonSource[] = [
      {
        id: "l1",
        transcript: [
          { id: "s1", startTime: 0, endTime: 3, text: "alpha bravo delta", translation: "one two four" },
          { id: "s2", startTime: 3, endTime: 6, text: "charlie alpha echo", translation: "three one five" },
        ],
      },
    ];

    it("builds word questions from the dictionary when lessons carry no authored vocab", () => {
      const round = buildCheckpointRound(transcriptOnly, "recall", DICT, 8, seededRng());
      expect(round.some((q) => q.format === "recall" || q.format === "match")).toBe(true);
    });

    it("never asks about a dictionary word absent from the covered lessons", () => {
      const round = buildCheckpointRound(transcriptOnly, "recall", DICT, 8, seededRng());
      for (const q of round) {
        if (q.kind !== "choice") continue;
        expect(q.correct).not.toBe("not in any lesson");
        expect(q.prompt).not.toBe("unrelated");
      }
    });

    it("matches transcript words ignoring case and trailing punctuation", () => {
      const punctuated: CheckpointLessonSource[] = [
        {
          id: "l1",
          transcript: [
            {
              id: "s1",
              startTime: 0,
              endTime: 3,
              text: "Alpha, bravo! charlie? delta. echo",
              translation: "one two three four five",
            },
          ],
        },
      ];
      const round = buildCheckpointRound(punctuated, "match", DICT, 8, seededRng());
      const answers = round.filter((q) => q.kind === "choice").map((q) => (q as { correct: string }).correct);
      expect(answers).toEqual(expect.arrayContaining(["alpha"]));
    });

    it("attributes a dictionary word to the covered lesson it appeared in", () => {
      const round = buildCheckpointRound(transcriptOnly, "recall", DICT, 8, seededRng());
      for (const q of round) expect(q.lessonId).toBe("l1");
    });
  });

  it("deduplicates a word repeated across covered lessons", () => {
    const dupes: CheckpointLessonSource[] = [
      { id: "l1", vocab: Array.from({ length: 4 }, (_, i) => ({ text: `w${i}`, translation: `m${i}` })) },
      { id: "l2", vocab: [{ text: "W0", translation: "m0" }] },
    ];
    const round = buildCheckpointRound(dupes, "recall", [], 8, seededRng());
    const prompts = round.filter((q) => q.kind === "choice").map((q) => (q as { prompt: string }).prompt.toLowerCase());
    expect(new Set(prompts).size).toBe(prompts.length);
  });
});

describe("isCorrectAnswer", () => {
  const choice: CheckpointQuestion = {
    kind: "choice",
    format: "recall",
    id: "q1",
    lessonId: "l1",
    prompt: "beni",
    correct: "water",
    options: ["water", "fire", "earth", "air"],
  };

  const order: CheckpointQuestion = {
    kind: "order",
    format: "build",
    id: "q2",
    lessonId: "l1",
    prompt: "I am going home",
    tokens: ["home", "going", "I", "am"],
    correct: ["I", "am", "going", "home"],
  };

  it("accepts the right choice regardless of case and padding", () => {
    expect(isCorrectAnswer(choice, "Water")).toBe(true);
    expect(isCorrectAnswer(choice, "  water ")).toBe(true);
  });

  it("rejects a wrong choice", () => {
    expect(isCorrectAnswer(choice, "fire")).toBe(false);
  });

  it("accepts only the exact token order", () => {
    expect(isCorrectAnswer(order, ["I", "am", "going", "home"])).toBe(true);
    expect(isCorrectAnswer(order, ["am", "I", "going", "home"])).toBe(false);
  });

  it("rejects an incomplete ordering", () => {
    expect(isCorrectAnswer(order, ["I", "am", "going"])).toBe(false);
  });
});
