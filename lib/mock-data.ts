import type { JournalEntry, FeedItem, Comment, Language, AudioSource } from "@/types";

// Local Izon audio recordings (bundled in app — used as fallback until CDN upload)
const AUDIO_IZON_BAI = require("../public/izon_bai.m4a");
const AUDIO_IZON_BO = require("../public/izon_bo.m4a");
const AUDIO_IZON_DOO = require("../public/izon_doo.m4a");
const AUDIO_IZON_MU = require("../public/izon_mu.m4a");
const AUDIO_IZON_NUA = require("../public/izon_nua.m4a");

// Sound effects
export const SFX_CORRECT = require("../public/correct.mp3");
export const SFX_INCORRECT = require("../public/incorrect.mp3");
export const SFX_FINISH = require("../public/finish.wav");

// Bundled audio fallback: used when lesson.audioUrl is null (not yet on CDN)
// Once Izon audio is uploaded to Vercel Blob, populate audioUrl in DB and this map is no longer used.
export const BUNDLED_AUDIO: Record<string, AudioSource> = {
  "lesson-1": AUDIO_IZON_BAI,
  "lesson-2": AUDIO_IZON_NUA,
  "lesson-3": AUDIO_IZON_DOO,
  "lesson-4": AUDIO_IZON_MU,
  "lesson-5": AUDIO_IZON_BO,
  "lesson-6": AUDIO_IZON_NUA,
  "lesson-7": AUDIO_IZON_DOO,
  "lesson-8": AUDIO_IZON_MU,
};

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
  // West Africa (non-Nigeria)
  { id: "akan", name: "Akan (Twi)", nativeName: "Akan", region: "West Africa" },
  { id: "ga", name: "Ga", nativeName: "Ga", region: "West Africa" },
  { id: "ewe", name: "Ewe", nativeName: "Eʋegbe", region: "West Africa" },
  { id: "wolof", name: "Wolof", nativeName: "Wolof", region: "West Africa" },
  { id: "bambara", name: "Bambara", nativeName: "Bamanankan", region: "West Africa" },
  { id: "mandinka", name: "Mandinka", nativeName: "Mandinka", region: "West Africa" },
  { id: "fon", name: "Fon", nativeName: "Fɔ̀ngbè", region: "West Africa" },
  { id: "mende", name: "Mende", nativeName: "Mɛnde", region: "West Africa" },
  { id: "krio", name: "Krio", nativeName: "Krio", region: "West Africa" },
  { id: "temne", name: "Temne", nativeName: "Temne", region: "West Africa" },
  { id: "dagbani", name: "Dagbani", nativeName: "Dagbanli", region: "West Africa" },
  { id: "moore", name: "Mooré", nativeName: "Mòoré", region: "West Africa" },
  // East Africa
  { id: "swahili", name: "Swahili", nativeName: "Kiswahili", region: "East Africa" },
  { id: "amharic", name: "Amharic", nativeName: "አማርኛ", region: "East Africa" },
  { id: "oromo", name: "Oromo", nativeName: "Afaan Oromoo", region: "East Africa" },
  { id: "tigrinya", name: "Tigrinya", nativeName: "ትግርኛ", region: "East Africa" },
  { id: "somali", name: "Somali", nativeName: "Soomaali", region: "East Africa" },
  { id: "luganda", name: "Luganda", nativeName: "Luganda", region: "East Africa" },
  { id: "kinyarwanda", name: "Kinyarwanda", nativeName: "Ikinyarwanda", region: "East Africa" },
  { id: "kirundi", name: "Kirundi", nativeName: "Ikirundi", region: "East Africa" },
  { id: "kikuyu", name: "Kikuyu", nativeName: "Gĩkũyũ", region: "East Africa" },
  { id: "luo", name: "Luo", nativeName: "Dholuo", region: "East Africa" },
  { id: "maasai", name: "Maasai", nativeName: "ɔl Maa", region: "East Africa" },
  // North Africa
  { id: "arabic-egyptian", name: "Arabic (Egyptian)", nativeName: "العربية المصرية", region: "North Africa" },
  { id: "arabic-maghrebi", name: "Arabic (Maghrebi)", nativeName: "الدارجة", region: "North Africa" },
  { id: "tamazight", name: "Tamazight (Berber)", nativeName: "ⵜⴰⵎⴰⵣⵉⵖⵜ", region: "North Africa" },
  { id: "kabyle", name: "Kabyle", nativeName: "Taqbaylit", region: "North Africa" },
  { id: "tuareg", name: "Tuareg (Tamashek)", nativeName: "Tamasheq", region: "North Africa" },
  { id: "coptic", name: "Coptic", nativeName: "ϯⲙⲉⲧⲣⲉⲙⲛⲕⲏⲙⲓ", region: "North Africa" },
  // Southern Africa
  { id: "zulu", name: "Zulu", nativeName: "isiZulu", region: "Southern Africa" },
  { id: "xhosa", name: "Xhosa", nativeName: "isiXhosa", region: "Southern Africa" },
  { id: "sotho", name: "Sotho", nativeName: "Sesotho", region: "Southern Africa" },
  { id: "tswana", name: "Tswana", nativeName: "Setswana", region: "Southern Africa" },
  { id: "shona", name: "Shona", nativeName: "chiShona", region: "Southern Africa" },
  { id: "ndebele", name: "Ndebele", nativeName: "isiNdebele", region: "Southern Africa" },
  { id: "tsonga", name: "Tsonga", nativeName: "Xitsonga", region: "Southern Africa" },
  { id: "venda", name: "Venda", nativeName: "Tshivenḓa", region: "Southern Africa" },
  { id: "swati", name: "Swati", nativeName: "siSwati", region: "Southern Africa" },
  { id: "afrikaans", name: "Afrikaans", nativeName: "Afrikaans", region: "Southern Africa" },
  { id: "chichewa", name: "Chichewa", nativeName: "Chicheŵa", region: "Southern Africa" },
  { id: "malagasy", name: "Malagasy", nativeName: "Malagasy", region: "Southern Africa" },
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

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
