/**
 * Single source of truth for all courses.
 *
 * Imported by:
 *  - Server seed (via relative path)
 *  - App can also import directly via @/lib/data/courses
 */

import type { CourseType } from "../../types/index";

export type CourseEntry = {
  id: string;
  languageId: string;
  title: string;
  description: string;
  level: string;
  lessonsCount: number;
  order: number;
  courseType: CourseType;
};

export const COURSES: CourseEntry[] = [
  // Izon (ordered: first_words → sound_script → numbers_trade → communicative → oral_tradition)
  { id: "course-1",  languageId: "izon",           title: "Emi — First Words",               description: "Begin with greetings, names, and introductions — the words that open doors and build belonging in Izon community.", level: "beginner",     lessonsCount: 5, order: 1, courseType: "first_words"    },
  { id: "course-19", languageId: "izon",           title: "Izọn Fiye — Sounds & Script",     description: "Master the phoneme inventory of Izon — vowel harmony, tonal contrasts, consonant digraphs, and the orthographic conventions used in written Izon.", level: "beginner", lessonsCount: 4, order: 2, courseType: "sound_script"   },
  { id: "course-20", languageId: "izon",           title: "Kịẹn mọ Okubo — Counting & Trade","description": "Learn the traditional Izon vigesimal counting system, market numerals, money vocabulary, and the akpa unit used in trade.", level: "beginner", lessonsCount: 3, order: 3, courseType: "numbers_trade"  },
  { id: "course-3",  languageId: "izon",           title: "Izọn Gba — Speaking Izon Well",   description: "Practise extended dialogues, social registers, and the politeness formulas that mark respectful speech across age and community contexts.", level: "beginner", lessonsCount: 3, order: 4, courseType: "communicative"  },
  { id: "course-2",  languageId: "izon",           title: "Teme Gba — The Old Stories",      description: "Listen to traditional Izon folktales, praise poetry, and proverbs rooted in the rivers, forests, and spiritual memory of the Niger Delta.", level: "intermediate", lessonsCount: 5, order: 5, courseType: "oral_tradition" },

  // Yoruba
  { id: "course-4",  languageId: "yoruba",         title: "Yoruba — First Words",            description: "Open with the greetings and self-introductions that signal respect and community in Yorùbá — the foundation for every conversation.", level: "beginner",     lessonsCount: 3, order: 1, courseType: "first_words"    },
  { id: "course-5",  languageId: "yoruba",         title: "Ọ̀wẹ̀ Yorùbá — Oral Tradition",   description: "Explore the proverbs, riddles, and oral wisdom through which Yorùbá people encode history, ethics, and cultural identity.", level: "intermediate", lessonsCount: 2, order: 2, courseType: "oral_tradition" },

  // Igbo
  { id: "course-6",  languageId: "igbo",           title: "Igbo — First Words",              description: "Start with the greetings and introductions that mark belonging and respect in Igbo — the emotional entry point into the language.", level: "beginner",     lessonsCount: 3, order: 1, courseType: "first_words"    },

  // Hausa
  { id: "course-7",  languageId: "hausa",          title: "Hausa — First Words",             description: "Begin with the greetings and social phrases of Hausa — the most widely spoken language in West Africa — and the identity words that open every exchange.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Swahili
  { id: "course-8",  languageId: "swahili",        title: "Kiswahili — First Words",         description: "Start with the greetings and introductions of Kiswahili — the lingua franca of East Africa — and the social phrases that build trust across communities.", level: "beginner", lessonsCount: 3, order: 1, courseType: "first_words"    },
  { id: "course-9",  languageId: "swahili",        title: "Methali — Oral Tradition",        description: "Discover the proverbs and oral wisdom of East African cultures encoded in Kiswahili methali — the living archive of communal knowledge.", level: "intermediate", lessonsCount: 2, order: 2, courseType: "oral_tradition" },

  // Amharic
  { id: "course-10", languageId: "amharic",        title: "Amharic — First Words",           description: "Begin with Amharic greetings and self-introductions — the phrases that signal respect and belonging in Ethiopia's official language.", level: "beginner",     lessonsCount: 3, order: 1, courseType: "first_words"    },

  // Akan (Twi)
  { id: "course-11", languageId: "akan",           title: "Twi — First Words",               description: "Open with the greetings and introductions of Twi — Ghana's most widely spoken language — and the social phrases that express warmth and community.", level: "beginner", lessonsCount: 3, order: 1, courseType: "first_words"    },

  // Wolof
  { id: "course-12", languageId: "wolof",          title: "Wolof — First Words",             description: "Begin with the warm greetings and identity expressions of Wolof — Senegal's dominant language, known for its culture of hospitality and welcome.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Egyptian Arabic
  { id: "course-13", languageId: "arabic-egyptian", title: "Egyptian Arabic — First Words",  description: "Start with the greetings and social phrases of Egyptian Arabic — the most widely understood Arabic dialect — and the expressions of identity that open every encounter.", level: "beginner", lessonsCount: 3, order: 1, courseType: "first_words"    },

  // Somali
  { id: "course-14", languageId: "somali",         title: "Soomaali — First Words",          description: "Begin with Somali greetings and introductions — the entry phrases of a Cushitic language with one of Africa's richest oral traditions.", level: "beginner",     lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Bambara
  { id: "course-15", languageId: "bambara",        title: "Bambara — First Words",           description: "Open with the greetings and social vocabulary of Bambara — the most widely spoken language of Mali — and the Manding expressions of identity and welcome.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Tamazight
  { id: "course-16", languageId: "tamazight",      title: "Tamazight — First Words",         description: "Begin with the greetings and identity expressions of Tamazight — the ancient Amazigh language of the Atlas mountains and Sahara — the words that carry millennia of belonging.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Kinyarwanda
  { id: "course-17", languageId: "kinyarwanda",    title: "Kinyarwanda — First Words",       description: "Start with the greetings and self-introductions of Kinyarwanda — Rwanda's national language and one of the most widely spoken Bantu languages in Central Africa.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },

  // Ewe
  { id: "course-18", languageId: "ewe",            title: "Eʋegbe — First Words",            description: "Begin with the greetings and identity words of Eʋegbe (Ewe) — a tonal language spoken across Ghana and Togo — and the social expressions that mark belonging.", level: "beginner", lessonsCount: 2, order: 1, courseType: "first_words"    },
];
