/**
 * Single source of truth for all courses.
 *
 * Imported by:
 *  - Server seed (via relative path)
 *  - App can also import directly via @/lib/data/courses
 */

export type CourseEntry = {
  id: string;
  languageId: string;
  title: string;
  description: string;
  level: string;
  lessonsCount: number;
  order: number;
};

export const COURSES: CourseEntry[] = [
  { id: "course-1", languageId: "izon", title: "Izon Basics", description: "Learn the fundamentals of Izon language — greetings, introductions, and everyday phrases.", level: "beginner", lessonsCount: 5, order: 1 },
  { id: "course-2", languageId: "izon", title: "Izon Stories", description: "Listen to traditional Izon folktales and cultural narratives rooted in the rivers, forests, and spiritual memory of the Niger Delta.", level: "intermediate", lessonsCount: 5, order: 2 },
  { id: "course-3", languageId: "izon", title: "Conversational Izon", description: "Master everyday conversations — markets, family, community, and greetings.", level: "beginner", lessonsCount: 3, order: 3 },
  { id: "course-4", languageId: "yoruba", title: "Yoruba Basics", description: "Start your Yoruba journey with essential greetings and phrases used daily.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-5", languageId: "yoruba", title: "Yoruba Proverbs", description: "Explore Yoruba wisdom through traditional proverbs and their meanings.", level: "intermediate", lessonsCount: 2, order: 2 },
  { id: "course-6", languageId: "igbo", title: "Igbo Basics", description: "Learn fundamental Igbo phrases, greetings, and introductions.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-7", languageId: "hausa", title: "Hausa Basics", description: "Get started with Hausa — the most widely spoken language in West Africa.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-8", languageId: "swahili", title: "Swahili Basics", description: "Learn the lingua franca of East Africa — greetings, introductions, and everyday phrases.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-9", languageId: "swahili", title: "Swahili Proverbs", description: "Discover the wisdom of East African cultures through Swahili proverbs.", level: "intermediate", lessonsCount: 2, order: 2 },
  { id: "course-10", languageId: "amharic", title: "Amharic Basics", description: "Start your journey with Ethiopia's official language — from greetings to daily conversation.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-11", languageId: "akan", title: "Akan (Twi) Basics", description: "Learn the most widely spoken language in Ghana — greetings, phrases, and culture.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-12", languageId: "wolof", title: "Wolof Basics", description: "Learn the dominant language of Senegal — known for its warmth and hospitality.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-13", languageId: "arabic-egyptian", title: "Egyptian Arabic Basics", description: "Learn the most widely understood Arabic dialect across North Africa and the Middle East.", level: "beginner", lessonsCount: 3, order: 1 },
  { id: "course-14", languageId: "somali", title: "Somali Basics", description: "Get started with Somali — a Cushitic language with a rich oral tradition.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-15", languageId: "bambara", title: "Bambara Basics", description: "Learn the most widely spoken language of Mali and the wider Manding family.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-16", languageId: "tamazight", title: "Tamazight Basics", description: "Explore Tamazight — the ancient Amazigh language of the Atlas mountains.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-17", languageId: "kinyarwanda", title: "Kinyarwanda Basics", description: "Learn the national language of Rwanda — one of the most widely spoken Bantu languages.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-18", languageId: "ewe", title: "Ewe Basics", description: "Learn Ewe, spoken in Ghana and Togo — a tonal language with beautiful musicality.", level: "beginner", lessonsCount: 2, order: 1 },
  { id: "course-19", languageId: "izon", title: "Izon Sounds & Spelling", description: "Master the phonetics of Izon — vowel harmony, consonant digraphs, nasalized vowels, and spelling rules.", level: "beginner", lessonsCount: 4, order: 4 },
  { id: "course-20", languageId: "izon", title: "Izon Numbers & Money", description: "Learn the traditional Izon counting system and the akpa money system used in markets.", level: "beginner", lessonsCount: 3, order: 5 },
];
