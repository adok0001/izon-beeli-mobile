import type { Course, Lesson, TranscriptSegment, JournalEntry, FeedItem, Comment, Language } from "@/types";

// Local Izon audio recordings
const AUDIO_IZON_BAI = require("../public/izon_bai.m4a");
const AUDIO_IZON_BO = require("../public/izon_bo.m4a");
const AUDIO_IZON_DOO = require("../public/izon_doo.m4a");
const AUDIO_IZON_MU = require("../public/izon_mu.m4a");
const AUDIO_IZON_NUA = require("../public/izon_nua.m4a");

// Sound effects
export const SFX_CORRECT = require("../public/correct.mp3");
export const SFX_INCORRECT = require("../public/incorrect.mp3");
export const SFX_FINISH = require("../public/finish.wav");

export const LANGUAGES: Language[] = [
  // Niger Delta
  { id: "izon", name: "Izon (Ijaw)", nativeName: "Ịzọn", region: "Niger Delta" },
  { id: "isoko", name: "Isoko", nativeName: "Isoko", region: "Niger Delta" },
  { id: "urhobo", name: "Urhobo", nativeName: "Urhobo", region: "Niger Delta" },
  { id: "itsekiri", name: "Itsekiri", nativeName: "Itsekiri", region: "Niger Delta" },
  { id: "ogbia", name: "Ogbia", nativeName: "Ogbia", region: "Niger Delta" },
  { id: "nembe", name: "Nembe", nativeName: "Nembe", region: "Niger Delta" },
  { id: "epie", name: "Epie-Atissa", nativeName: "Epie", region: "Niger Delta" },
  // Southwest
  { id: "yoruba", name: "Yoruba", nativeName: "Yorùbá", region: "Southwest" },
  { id: "igala", name: "Igala", nativeName: "Igala", region: "Southwest" },
  { id: "edo", name: "Edo (Bini)", nativeName: "Ẹdo", region: "Southwest" },
  { id: "esan", name: "Esan", nativeName: "Esan", region: "Southwest" },
  { id: "etsako", name: "Etsako", nativeName: "Etsako", region: "Southwest" },
  // Southeast
  { id: "igbo", name: "Igbo", nativeName: "Igbo", region: "Southeast" },
  { id: "ibibio", name: "Ibibio", nativeName: "Ibibio", region: "Southeast" },
  { id: "efik", name: "Efik", nativeName: "Efịk", region: "Southeast" },
  { id: "annang", name: "Annang", nativeName: "Annang", region: "Southeast" },
  { id: "ekene", name: "Ikwerre", nativeName: "Ikwerre", region: "Southeast" },
  { id: "ogoni", name: "Ogoni (Khana)", nativeName: "Khana", region: "Southeast" },
  // North Central
  { id: "tiv", name: "Tiv", nativeName: "Tiv", region: "North Central" },
  { id: "nupe", name: "Nupe", nativeName: "Nupe", region: "North Central" },
  { id: "gbagyi", name: "Gbagyi", nativeName: "Gbagyi", region: "North Central" },
  { id: "idoma", name: "Idoma", nativeName: "Idoma", region: "North Central" },
  { id: "jukun", name: "Jukun", nativeName: "Jukun", region: "North Central" },
  { id: "berom", name: "Berom", nativeName: "Berom", region: "North Central" },
  // North
  { id: "hausa", name: "Hausa", nativeName: "Hausa", region: "North" },
  { id: "kanuri", name: "Kanuri", nativeName: "Kanuri", region: "North" },
  { id: "fulfulde", name: "Fulfulde (Fula)", nativeName: "Fulfulde", region: "North" },
  { id: "margi", name: "Margi", nativeName: "Margi", region: "North" },
  { id: "bura", name: "Bura", nativeName: "Bura", region: "North" },
];

export const COURSES: Course[] = [
  // Izon
  {
    id: "course-1",
    title: "Izon Basics",
    description: "Learn the fundamentals of Izon language — greetings, introductions, and everyday phrases.",
    language: "izon",
    level: "beginner",
    lessonsCount: 5,
    progress: 40,
  },
  {
    id: "course-2",
    title: "Izon Stories",
    description: "Listen to traditional Izon folktales and build your listening comprehension.",
    language: "izon",
    level: "intermediate",
    lessonsCount: 2,
    progress: 0,
  },
  {
    id: "course-3",
    title: "Conversational Izon",
    description: "Master everyday conversations — markets, family, community, and greetings.",
    language: "izon",
    level: "beginner",
    lessonsCount: 1,
    progress: 0,
  },
  // Yoruba
  {
    id: "course-4",
    title: "Yoruba Basics",
    description: "Start your Yoruba journey with essential greetings and phrases used daily.",
    language: "yoruba",
    level: "beginner",
    lessonsCount: 3,
    progress: 0,
  },
  {
    id: "course-5",
    title: "Yoruba Proverbs",
    description: "Explore Yoruba wisdom through traditional proverbs and their meanings.",
    language: "yoruba",
    level: "intermediate",
    lessonsCount: 2,
    progress: 0,
  },
  // Igbo
  {
    id: "course-6",
    title: "Igbo Basics",
    description: "Learn fundamental Igbo phrases, greetings, and introductions.",
    language: "igbo",
    level: "beginner",
    lessonsCount: 3,
    progress: 0,
  },
  // Hausa
  {
    id: "course-7",
    title: "Hausa Basics",
    description: "Get started with Hausa — the most widely spoken language in West Africa.",
    language: "hausa",
    level: "beginner",
    lessonsCount: 2,
    progress: 0,
  },
];

const TRANSCRIPT_LESSON_1: TranscriptSegment[] = [
  { id: "t1", startTime: 0, endTime: 3, text: "Ọya bẹi sei", translation: "Good morning" },
  { id: "t2", startTime: 3, endTime: 6.5, text: "Ẹmi nimọ ni mi", translation: "My name is" },
  { id: "t3", startTime: 6.5, endTime: 10, text: "Ẹpẹlẹ ọ?", translation: "How are you?" },
  { id: "t4", startTime: 10, endTime: 14, text: "Ẹpẹlẹ mi sei", translation: "I am fine" },
  { id: "t5", startTime: 14, endTime: 18, text: "Dụba ka mi sẹi", translation: "Thank you very much" },
  { id: "t6", startTime: 18, endTime: 22, text: "Tari ọ kẹ sẹi?", translation: "Where are you going?" },
  { id: "t7", startTime: 22, endTime: 26, text: "Mi yin kẹ sẹi", translation: "I am going home" },
  { id: "t8", startTime: 26, endTime: 30, text: "Ọya bẹi kiri", translation: "Good night" },
];

const TRANSCRIPT_LESSON_2: TranscriptSegment[] = [
  { id: "t2-1", startTime: 0, endTime: 4, text: "Kẹni kẹni, ebifaa kpo amọ ba sẹi", translation: "Long ago, a tortoise lived in the forest" },
  { id: "t2-2", startTime: 4, endTime: 8, text: "Ebifaa naa bọrọ faa sẹi", translation: "The tortoise was very clever" },
  { id: "t2-3", startTime: 8, endTime: 12, text: "Ọ bẹlẹ naa ọgbọ kpo amọ sei", translation: "One day he saw a river" },
  { id: "t2-4", startTime: 12, endTime: 16, text: "Ọgbọ naa yeri bou faa sẹi", translation: "The river was very wide" },
  { id: "t2-5", startTime: 16, endTime: 20, text: "Ebifaa naa sẹi a dẹi?", translation: "What did the tortoise do?" },
  { id: "t2-6", startTime: 20, endTime: 24, text: "Ọ kiri fịn timi sẹi", translation: "He thought very carefully" },
];

const TRANSCRIPT_YORUBA_1: TranscriptSegment[] = [
  { id: "ty1", startTime: 0, endTime: 3.5, text: "E kaaro o", translation: "Good morning" },
  { id: "ty2", startTime: 3.5, endTime: 7, text: "Oruko mi ni...", translation: "My name is..." },
  { id: "ty3", startTime: 7, endTime: 11, text: "Bawo ni?", translation: "How are you?" },
  { id: "ty4", startTime: 11, endTime: 15, text: "Mo wa daadaa", translation: "I am fine" },
  { id: "ty5", startTime: 15, endTime: 19, text: "E se pupo", translation: "Thank you very much" },
  { id: "ty6", startTime: 19, endTime: 23, text: "Nibo lo n lo?", translation: "Where are you going?" },
  { id: "ty7", startTime: 23, endTime: 27, text: "Mo n lo si ile", translation: "I am going home" },
  { id: "ty8", startTime: 27, endTime: 30, text: "O dabo", translation: "Goodbye" },
];

const TRANSCRIPT_IGBO_1: TranscriptSegment[] = [
  { id: "ti1", startTime: 0, endTime: 3.5, text: "Ututu oma", translation: "Good morning" },
  { id: "ti2", startTime: 3.5, endTime: 7, text: "Aha m bu...", translation: "My name is..." },
  { id: "ti3", startTime: 7, endTime: 11, text: "Kedu ka i mere?", translation: "How are you?" },
  { id: "ti4", startTime: 11, endTime: 15, text: "A di m mma", translation: "I am fine" },
  { id: "ti5", startTime: 15, endTime: 19, text: "Dalu rinne", translation: "Thank you very much" },
  { id: "ti6", startTime: 19, endTime: 23, text: "Ebee ka i na aga?", translation: "Where are you going?" },
  { id: "ti7", startTime: 23, endTime: 27, text: "Ana m aga n'ulo", translation: "I am going home" },
  { id: "ti8", startTime: 27, endTime: 30, text: "Ka omesia", translation: "See you later" },
];

export const LESSONS: Lesson[] = [
  // Izon course-1
  {
    id: "lesson-1",
    courseId: "course-1",
    title: "Greetings & Introductions",
    description: "Learn how to greet people and introduce yourself in Izon.",
    audioUrl: AUDIO_IZON_BAI,
    duration: 4,
    order: 1,
    completed: true,
    transcript: TRANSCRIPT_LESSON_1,
  },
  {
    id: "lesson-2",
    courseId: "course-1",
    title: "The Tortoise and the River",
    description: "A traditional Izon folktale about a clever tortoise.",
    audioUrl: AUDIO_IZON_NUA,
    duration: 5,
    order: 2,
    completed: true,
    transcript: TRANSCRIPT_LESSON_2,
  },
  {
    id: "lesson-3",
    courseId: "course-1",
    title: "Numbers & Counting",
    description: "Learn to count from 1 to 20 in Izon.",
    audioUrl: AUDIO_IZON_DOO,
    duration: 5,
    order: 3,
    completed: false,
  },
  {
    id: "lesson-4",
    courseId: "course-1",
    title: "Family Members",
    description: "Learn Izon words for family members and relationships.",
    audioUrl: AUDIO_IZON_MU,
    duration: 4,
    order: 4,
    completed: false,
  },
  {
    id: "lesson-5",
    courseId: "course-1",
    title: "Daily Activities",
    description: "Describe your daily routine using Izon verbs and phrases.",
    audioUrl: AUDIO_IZON_BO,
    duration: 5,
    order: 5,
    completed: false,
  },
  // Izon course-2
  {
    id: "lesson-6",
    courseId: "course-2",
    title: "The Fisherman's Tale",
    description: "A story about a brave fisherman from the Niger Delta.",
    audioUrl: AUDIO_IZON_NUA,
    duration: 5,
    order: 1,
    completed: false,
  },
  {
    id: "lesson-7",
    courseId: "course-2",
    title: "The Market Day",
    description: "Listen to a story set in a busy Izon market.",
    audioUrl: AUDIO_IZON_DOO,
    duration: 5,
    order: 2,
    completed: false,
  },
  // Izon course-3
  {
    id: "lesson-8",
    courseId: "course-3",
    title: "At the Market",
    description: "Learn how to bargain and buy items at the market.",
    audioUrl: AUDIO_IZON_MU,
    duration: 4,
    order: 1,
    completed: false,
  },
  // Yoruba course-4
  {
    id: "lesson-9",
    courseId: "course-4",
    title: "Yoruba Greetings",
    description: "Master the essential greetings used in everyday Yoruba conversation.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    duration: 30,
    order: 1,
    completed: false,
    transcript: TRANSCRIPT_YORUBA_1,
  },
  {
    id: "lesson-10",
    courseId: "course-4",
    title: "Yoruba Numbers",
    description: "Count from 1 to 20 in Yoruba with proper pronunciation.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    duration: 195,
    order: 2,
    completed: false,
  },
  {
    id: "lesson-11",
    courseId: "course-4",
    title: "Yoruba Family Words",
    description: "Learn how to address family members in Yoruba culture.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    duration: 220,
    order: 3,
    completed: false,
  },
  // Yoruba course-5
  {
    id: "lesson-12",
    courseId: "course-5",
    title: "Proverbs of Wisdom",
    description: "Explore Yoruba proverbs about wisdom and patience.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    duration: 260,
    order: 1,
    completed: false,
  },
  {
    id: "lesson-13",
    courseId: "course-5",
    title: "Proverbs of Community",
    description: "Learn proverbs about togetherness and community in Yoruba.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    duration: 240,
    order: 2,
    completed: false,
  },
  // Igbo course-6
  {
    id: "lesson-14",
    courseId: "course-6",
    title: "Igbo Greetings",
    description: "Learn essential Igbo greetings for every time of day.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3",
    duration: 30,
    order: 1,
    completed: false,
    transcript: TRANSCRIPT_IGBO_1,
  },
  {
    id: "lesson-15",
    courseId: "course-6",
    title: "Igbo Numbers",
    description: "Master counting in Igbo from 1 to 20.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3",
    duration: 185,
    order: 2,
    completed: false,
  },
  {
    id: "lesson-16",
    courseId: "course-6",
    title: "Igbo Family Words",
    description: "Learn Igbo terms for family members and relationships.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
    duration: 210,
    order: 3,
    completed: false,
  },
  // Hausa course-7
  {
    id: "lesson-17",
    courseId: "course-7",
    title: "Hausa Greetings",
    description: "Start speaking Hausa with proper greetings and introductions.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: 175,
    order: 1,
    completed: false,
  },
  {
    id: "lesson-18",
    courseId: "course-7",
    title: "Hausa Numbers",
    description: "Learn to count in Hausa — one of Africa's most spoken languages.",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: 190,
    order: 2,
    completed: false,
  },
];

export const SAMPLE_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "j1",
    title: "First Lesson!",
    content: "Today I learned basic Izon greetings. 'Ọya bẹi sei' means Good morning! I find the tonal patterns interesting.",
    lessonId: "lesson-1",
    createdAt: "2025-01-15T10:30:00Z",
    updatedAt: "2025-01-15T10:30:00Z",
  },
  {
    id: "j2",
    title: "The Tortoise Story",
    content: "Listened to the tortoise folktale. The storytelling style is beautiful. I want to practice retelling it.",
    lessonId: "lesson-2",
    createdAt: "2025-01-16T14:00:00Z",
    updatedAt: "2025-01-16T14:00:00Z",
  },
];

export const SAMPLE_FEED: FeedItem[] = [
  {
    id: "f1",
    type: "lesson_completed",
    title: "Completed Greetings & Introductions",
    description: "Finished the first lesson in Izon Basics",
    userName: "Tamara A.",
    createdAt: "2025-01-15T10:30:00Z",
    likes: 5,
    comments: 2,
  },
  {
    id: "f2",
    type: "contribution",
    title: "New audio recording",
    description: "Contributed a pronunciation guide for common Yoruba greetings",
    userName: "Ebi O.",
    createdAt: "2025-01-14T16:00:00Z",
    likes: 12,
    comments: 4,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "f3",
    type: "achievement",
    title: "7-day streak!",
    description: "Reached a 7-day learning streak across Izon and Yoruba",
    userName: "Diepreye K.",
    createdAt: "2025-01-13T09:00:00Z",
    likes: 20,
    comments: 8,
  },
  {
    id: "f4",
    type: "community",
    title: "Study group forming",
    description: "Looking for learners to practice conversational Igbo together on weekends",
    userName: "Seiyefa T.",
    createdAt: "2025-01-12T12:00:00Z",
    likes: 15,
    comments: 11,
  },
  {
    id: "f5",
    type: "lesson_completed",
    title: "Completed The Tortoise and the River",
    description: "Loved this traditional Izon folktale! The narrator's voice is captivating.",
    userName: "Boma D.",
    createdAt: "2025-01-11T18:00:00Z",
    likes: 8,
    comments: 3,
  },
  {
    id: "f6",
    type: "contribution",
    title: "Hausa translation added",
    description: "Translated 15 common phrases into Hausa with audio recordings",
    userName: "Amina B.",
    createdAt: "2025-01-10T11:00:00Z",
    likes: 18,
    comments: 6,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
];

export const SAMPLE_COMMENTS: Comment[] = [
  // f1 comments
  { id: "c1", feedItemId: "f1", userName: "Ebi O.", text: "Great job! Keep it up!", createdAt: "2025-01-15T11:00:00Z" },
  { id: "c2", feedItemId: "f1", userName: "Diepreye K.", text: "The greetings lesson is one of my favourites", createdAt: "2025-01-15T12:30:00Z" },
  // f2 comments
  { id: "c3", feedItemId: "f2", userName: "Tamara A.", text: "This is so helpful, thank you!", createdAt: "2025-01-14T17:00:00Z" },
  { id: "c4", feedItemId: "f2", userName: "Seiyefa T.", text: "Your pronunciation is really clear", createdAt: "2025-01-14T18:00:00Z" },
  { id: "c5", feedItemId: "f2", userName: "Boma D.", text: "Can you do one for Igbo greetings too?", createdAt: "2025-01-14T19:00:00Z" },
  { id: "c6", feedItemId: "f2", userName: "Amina B.", text: "Shared this with my study group!", createdAt: "2025-01-14T20:00:00Z" },
  // f3 comments
  { id: "c7", feedItemId: "f3", userName: "Tamara A.", text: "Wow 7 days, amazing consistency!", createdAt: "2025-01-13T10:00:00Z" },
  { id: "c8", feedItemId: "f3", userName: "Ebi O.", text: "Inspiring! I'm on day 3 myself", createdAt: "2025-01-13T11:00:00Z" },
  // f4 comments
  { id: "c9", feedItemId: "f4", userName: "Diepreye K.", text: "Count me in! What time on weekends?", createdAt: "2025-01-12T13:00:00Z" },
  { id: "c10", feedItemId: "f4", userName: "Boma D.", text: "I'd love to join, I'm learning Igbo basics", createdAt: "2025-01-12T14:00:00Z" },
  // f5 comments
  { id: "c11", feedItemId: "f5", userName: "Seiyefa T.", text: "The narrator is incredible!", createdAt: "2025-01-11T19:00:00Z" },
  // f6 comments
  { id: "c12", feedItemId: "f6", userName: "Diepreye K.", text: "This is a huge contribution, thank you Amina!", createdAt: "2025-01-10T12:00:00Z" },
  { id: "c13", feedItemId: "f6", userName: "Tamara A.", text: "The audio quality is perfect", createdAt: "2025-01-10T13:00:00Z" },
];

export function getLanguageName(id: string): string {
  return LANGUAGES.find((l) => l.id === id)?.name ?? id;
}

export function getCoursesByLanguage(languageId: string): Course[] {
  return COURSES.filter((c) => c.language === languageId);
}

export function getLessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function getLessonsByCourse(courseId: string): Lesson[] {
  return LESSONS.filter((l) => l.courseId === courseId);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
