import "dotenv/config";
import { db } from "../db/index.js";
import {
  users,
  feedItems,
  comments,
  languages,
  courses,
  lessons,
  transcriptSegments,
  dictionaryEntries,
  proverbs,
  culturalContent,
  culturalKeyTerms,
  sentenceTemplates,
} from "../db/schema.js";
import { eq } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Static dictionary data (imported from app lib/data)
// Note: all "@/" imports in these files are type-only and are erased at runtime
// ---------------------------------------------------------------------------
import { IZON_DICTIONARY } from "../../../lib/data/izon.js";
import { YORUBA_DICTIONARY } from "../../../lib/data/yoruba.js";
import { IGBO_DICTIONARY } from "../../../lib/data/igbo.js";
import { HAUSA_DICTIONARY } from "../../../lib/data/hausa.js";
import { SWAHILI_DICTIONARY } from "../../../lib/data/swahili.js";
import { AMHARIC_DICTIONARY } from "../../../lib/data/amharic.js";
import { AKAN_DICTIONARY } from "../../../lib/data/akan.js";
import { WOLOF_DICTIONARY } from "../../../lib/data/wolof.js";
import { ARABIC_EGYPTIAN_DICTIONARY } from "../../../lib/data/arabic-egyptian.js";
import { SOMALI_DICTIONARY } from "../../../lib/data/somali.js";
import { BAMBARA_DICTIONARY } from "../../../lib/data/bambara.js";
import { TAMAZIGHT_DICTIONARY } from "../../../lib/data/tamazight.js";
import { KINYARWANDA_DICTIONARY } from "../../../lib/data/kinyarwanda.js";
import { EWE_DICTIONARY } from "../../../lib/data/ewe.js";
import { OROMO_DICTIONARY } from "../../../lib/data/oromo.js";
import { SHONA_DICTIONARY } from "../../../lib/data/shona.js";

import { IZON_PROVERBS } from "../../../lib/data/proverbs/izon.js";
import { YORUBA_PROVERBS } from "../../../lib/data/proverbs/yoruba.js";
import { AKAN_PROVERBS } from "../../../lib/data/proverbs/akan.js";
import { IGBO_PROVERBS } from "../../../lib/data/proverbs/igbo.js";
import { HAUSA_PROVERBS } from "../../../lib/data/proverbs/hausa.js";
import { SWAHILI_PROVERBS } from "../../../lib/data/proverbs/swahili.js";
import { AMHARIC_PROVERBS } from "../../../lib/data/proverbs/amharic.js";
import { WOLOF_PROVERBS } from "../../../lib/data/proverbs/wolof.js";
import { ARABIC_EGYPTIAN_PROVERBS } from "../../../lib/data/proverbs/arabic-egyptian.js";
import { SOMALI_PROVERBS } from "../../../lib/data/proverbs/somali.js";
import { BAMBARA_PROVERBS } from "../../../lib/data/proverbs/bambara.js";
import { TAMAZIGHT_PROVERBS } from "../../../lib/data/proverbs/tamazight.js";
import { KINYARWANDA_PROVERBS } from "../../../lib/data/proverbs/kinyarwanda.js";
import { EWE_PROVERBS } from "../../../lib/data/proverbs/ewe.js";

import { IZON_CULTURAL } from "../../../lib/data/cultural/izon.js";
import { YORUBA_CULTURAL } from "../../../lib/data/cultural/yoruba.js";
import { AKAN_CULTURAL } from "../../../lib/data/cultural/akan.js";
import { IGBO_CULTURAL } from "../../../lib/data/cultural/igbo.js";
import { HAUSA_CULTURAL } from "../../../lib/data/cultural/hausa.js";
import { SWAHILI_CULTURAL } from "../../../lib/data/cultural/swahili.js";
import { AMHARIC_CULTURAL } from "../../../lib/data/cultural/amharic.js";
import { WOLOF_CULTURAL } from "../../../lib/data/cultural/wolof.js";
import { ARABIC_EGYPTIAN_CULTURAL } from "../../../lib/data/cultural/arabic-egyptian.js";
import { SOMALI_CULTURAL } from "../../../lib/data/cultural/somali.js";
import { BAMBARA_CULTURAL } from "../../../lib/data/cultural/bambara.js";
import { TAMAZIGHT_CULTURAL } from "../../../lib/data/cultural/tamazight.js";
import { KINYARWANDA_CULTURAL } from "../../../lib/data/cultural/kinyarwanda.js";
import { EWE_CULTURAL } from "../../../lib/data/cultural/ewe.js";

import { IZON_SENTENCES } from "../../../lib/data/sentences/izon.js";
import { IGBO_SENTENCES } from "../../../lib/data/sentences/igbo.js";
import { HAUSA_SENTENCES } from "../../../lib/data/sentences/hausa.js";
import { SWAHILI_SENTENCES } from "../../../lib/data/sentences/swahili.js";
import { AMHARIC_SENTENCES } from "../../../lib/data/sentences/amharic.js";
import { WOLOF_SENTENCES } from "../../../lib/data/sentences/wolof.js";
import { ARABIC_EGYPTIAN_SENTENCES } from "../../../lib/data/sentences/arabic-egyptian.js";
import { SOMALI_SENTENCES } from "../../../lib/data/sentences/somali.js";
import { BAMBARA_SENTENCES } from "../../../lib/data/sentences/bambara.js";
import { TAMAZIGHT_SENTENCES } from "../../../lib/data/sentences/tamazight.js";
import { KINYARWANDA_SENTENCES } from "../../../lib/data/sentences/kinyarwanda.js";
import { EWE_SENTENCES } from "../../../lib/data/sentences/ewe.js";

// ---------------------------------------------------------------------------
// Inline static data (from lib/mock-data.ts — avoids require() for audio)
// ---------------------------------------------------------------------------

const SEED_LANGUAGES = [
  { id: "izon", name: "Izon (Ijaw)", nativeName: "Ịzọn", region: "Niger Delta" },
  { id: "isoko", name: "Isoko", nativeName: "Isoko", region: "Niger Delta" },
  { id: "urhobo", name: "Urhobo", nativeName: "Urhobo", region: "Niger Delta" },
  { id: "itsekiri", name: "Itsekiri", nativeName: "Itsekiri", region: "Niger Delta" },
  { id: "ogbia", name: "Ogbia", nativeName: "Ogbia", region: "Niger Delta" },
  { id: "nembe", name: "Nembe", nativeName: "Nembe", region: "Niger Delta" },
  { id: "epie", name: "Epie-Atissa", nativeName: "Epie", region: "Niger Delta" },
  { id: "yoruba", name: "Yoruba", nativeName: "Yorùbá", region: "Southwest" },
  { id: "igala", name: "Igala", nativeName: "Igala", region: "Southwest" },
  { id: "edo", name: "Edo (Bini)", nativeName: "Ẹdo", region: "Southwest" },
  { id: "esan", name: "Esan", nativeName: "Esan", region: "Southwest" },
  { id: "etsako", name: "Etsako", nativeName: "Etsako", region: "Southwest" },
  { id: "igbo", name: "Igbo", nativeName: "Igbo", region: "Southeast" },
  { id: "ibibio", name: "Ibibio", nativeName: "Ibibio", region: "Southeast" },
  { id: "efik", name: "Efik", nativeName: "Efịk", region: "Southeast" },
  { id: "annang", name: "Annang", nativeName: "Annang", region: "Southeast" },
  { id: "ekene", name: "Ikwerre", nativeName: "Ikwerre", region: "Southeast" },
  { id: "ogoni", name: "Ogoni (Khana)", nativeName: "Khana", region: "Southeast" },
  { id: "tiv", name: "Tiv", nativeName: "Tiv", region: "North Central" },
  { id: "nupe", name: "Nupe", nativeName: "Nupe", region: "North Central" },
  { id: "gbagyi", name: "Gbagyi", nativeName: "Gbagyi", region: "North Central" },
  { id: "idoma", name: "Idoma", nativeName: "Idoma", region: "North Central" },
  { id: "jukun", name: "Jukun", nativeName: "Jukun", region: "North Central" },
  { id: "berom", name: "Berom", nativeName: "Berom", region: "North Central" },
  { id: "hausa", name: "Hausa", nativeName: "Hausa", region: "North" },
  { id: "kanuri", name: "Kanuri", nativeName: "Kanuri", region: "North" },
  { id: "fulfulde", name: "Fulfulde (Fula)", nativeName: "Fulfulde", region: "North" },
  { id: "margi", name: "Margi", nativeName: "Margi", region: "North" },
  { id: "bura", name: "Bura", nativeName: "Bura", region: "North" },
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
  { id: "arabic-egyptian", name: "Arabic (Egyptian)", nativeName: "العربية المصرية", region: "North Africa" },
  { id: "arabic-maghrebi", name: "Arabic (Maghrebi)", nativeName: "الدارجة", region: "North Africa" },
  { id: "tamazight", name: "Tamazight (Berber)", nativeName: "ⵜⴰⵎⴰⵣⵉⵖⵜ", region: "North Africa" },
  { id: "kabyle", name: "Kabyle", nativeName: "Taqbaylit", region: "North Africa" },
  { id: "tuareg", name: "Tuareg (Tamashek)", nativeName: "Tamasheq", region: "North Africa" },
  { id: "coptic", name: "Coptic", nativeName: "ϯⲙⲉⲧⲣⲉⲙⲛⲕⲏⲙⲓ", region: "North Africa" },
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

const SEED_COURSES = [
  { id: "course-1", languageId: "izon", title: "Izon Basics", description: "Learn the fundamentals of Izon language — greetings, introductions, and everyday phrases.", level: "beginner", lessonsCount: 5, order: 1 },
  { id: "course-2", languageId: "izon", title: "Izon Stories", description: "Listen to traditional Izon folktales and build your listening comprehension.", level: "intermediate", lessonsCount: 2, order: 2 },
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

// Lessons — audioUrl is null for bundled Izon lessons (app uses BUNDLED_AUDIO fallback)
// HTTP URL lessons keep their URLs
const SEED_LESSONS: {
  id: string;
  courseId: string;
  title: string;
  description: string;
  audioUrl: string | null;
  duration: number | null;
  order: number;
  transcript: { id: string; startTime: number; endTime: number; text: string; translation?: string }[];
}[] = [
  {
    id: "lesson-1", courseId: "course-1", title: "Greetings & Introductions",
    description: "Learn how to greet people and introduce yourself in Izon.",
    audioUrl: null, duration: 4, order: 1,
    transcript: [
      { id: "t1", startTime: 0, endTime: 3, text: "Kẹni kẹni, owei kẹnị bo ama kpo sẹi", translation: "Once upon a time, a stranger arrived in a village" },
      { id: "t2", startTime: 3, endTime: 6.5, text: "Pekei pekei ama sụọ mene, Baidẹ!", translation: "Early in the morning he entered the town: Good morning!" },
      { id: "t3", startTime: 6.5, endTime: 10, text: "Kosu dau kẹnị gba: Teki ina ẹrẹ?", translation: "An elder asked: What is your name?" },
      { id: "t4", startTime: 10, endTime: 14, text: "Ina ẹrẹmẹ Timi. Tụbara?", translation: "My name is Timi. How are you?" },
      { id: "t5", startTime: 14, endTime: 18, text: "Emi! Kuro nimi, the elder replied", translation: "I am fine! I am well, the elder replied" },
      { id: "t6", startTime: 18, endTime: 22, text: "Ụmbana, Timi said. Doo!", translation: "Thank you, Timi said. Thank you!" },
      { id: "t7", startTime: 22, endTime: 26, text: "Nụa! Ebodẹ-a! the village welcomed him", translation: "Welcome! Welcome! the village greeted him" },
      { id: "t8", startTime: 26, endTime: 30, text: "Baịyo, owei! Bunuda seri!", translation: "Good night, friend! Sleep well!" },
    ],
  },
  {
    id: "lesson-2", courseId: "course-1", title: "The Tortoise and the River",
    description: "A traditional Izon folktale about a clever tortoise.",
    audioUrl: null, duration: 5, order: 2,
    transcript: [
      { id: "t2-1", startTime: 0, endTime: 4, text: "Kẹni kẹni, ebifaa kpo amọ ba sẹi", translation: "Long ago, a tortoise lived in the forest" },
      { id: "t2-2", startTime: 4, endTime: 8, text: "Ebifaa naa bọrọ faa sẹi", translation: "The tortoise was very clever" },
      { id: "t2-3", startTime: 8, endTime: 12, text: "Ọ bẹlẹ naa ọgbọ kpo amọ sei", translation: "One day he saw a river" },
      { id: "t2-4", startTime: 12, endTime: 16, text: "Ọgbọ naa yeri bou faa sẹi", translation: "The river was very wide" },
      { id: "t2-5", startTime: 16, endTime: 20, text: "Ebifaa naa sẹi a dẹi?", translation: "What did the tortoise do?" },
      { id: "t2-6", startTime: 20, endTime: 24, text: "Ọ kiri fịn timi sẹi", translation: "He thought very carefully" },
    ],
  },
  { id: "lesson-3", courseId: "course-1", title: "Numbers & Counting", description: "Learn to count from 1 to 20 in Izon.", audioUrl: null, duration: 5, order: 3, transcript: [] },
  {
    id: "lesson-4", courseId: "course-1", title: "Family Members",
    description: "Learn Izon words for family members and relationships — including a conversation about who is at home.",
    audioUrl: null, duration: 5, order: 4,
    transcript: [
      { id: "t4-1", startTime: 0, endTime: 4, text: "E buburudẹ, Erearau Adokeme?", translation: "Good morning, Mrs Adokeme?" },
      { id: "t4-2", startTime: 4, endTime: 8, text: "E buburudẹ, Kịmịowei Pẹrezi?", translation: "Good morning, Dr Pẹrezi?" },
      { id: "t4-3", startTime: 8, endTime: 13, text: "Sesei, Tamara warị a emi a?", translation: "Please, is Tamara at home?" },
      { id: "t4-4", startTime: 13, endTime: 18, text: "Aghaịn o! O warị a fa o, o fun tolumọ yọ ka emi.", translation: "No! He is not at home, he is at school." },
      { id: "t4-5", startTime: 18, endTime: 23, text: "Vivian kpọ fun tolumọ yọ ka emi a?", translation: "Is Vivian at school too?" },
      { id: "t4-6", startTime: 23, endTime: 29, text: "Aghaịn o. Amịnị warị ka emi. Amịnị eyifị-okpo ka emi.", translation: "No. She is at home. She is in the dining-room." },
      { id: "t4-7", startTime: 29, endTime: 34, text: "Fịyaị kị emu koromọmịnị.", translation: "I am laying the table." },
      { id: "t4-8", startTime: 34, endTime: 40, text: "Emịnị fịyaị koromo o, ereinbiri fịyaị kị emu tụọmịnị.", translation: "I am not laying the table, I am cooking lunch." },
    ],
  },
  {
    id: "lesson-5", courseId: "course-1", title: "Daily Activities",
    description: "Describe your daily routine — meals, morning, afternoon, and evening activities — using Izon verbs and phrases.",
    audioUrl: null, duration: 5, order: 5,
    transcript: [
      { id: "t5-1", startTime: 0, endTime: 5, text: "Mị bọ ereịn enị bịna-arau mịnị zii erein teimị.", translation: "My sister celebrated her birthday yesterday." },
      { id: "t5-2", startTime: 5, endTime: 10, text: "Ọrọsị mọ ofoni mo omu fịmị.", translation: "I ate rice and chicken." },
      { id: "t5-3", startTime: 10, endTime: 15, text: "Emịnị kenị koku ololo kpo boumị.", translation: "I also took a bottle of Coke." },
      { id: "t5-4", startTime: 15, endTime: 20, text: "Mị bọ ereịnmị tị eyi kị emu fịma?", translation: "What did you eat yesterday?" },
      { id: "t5-5", startTime: 20, endTime: 25, text: "Bịredị mọ tii mọ kị e pikei ma mu boumị.", translation: "I took bread and tea in the morning." },
      { id: "t5-6", startTime: 25, endTime: 30, text: "Ereinbiri mị tị eyi kị emu fịma?", translation: "What did you eat in the afternoon?" },
      { id: "t5-7", startTime: 30, endTime: 35, text: "Buru mọ ange mọ kị emu fịmị.", translation: "I ate yam and egg." },
      { id: "t5-8", startTime: 35, endTime: 41, text: "Si oyia miniti feni emu kọn bọnọmị. Eba televisọni dii timi buburu nina lamị.", translation: "I slept for thirty minutes then watched television till 8pm." },
    ],
  },
  {
    id: "lesson-6", courseId: "course-2", title: "The Akasa Forest",
    description: "A grandfather tells his grandchild about the sacred Akasa forest and the ancestors who dwell within.",
    audioUrl: null, duration: 5, order: 1,
    transcript: [
      { id: "t6-1", startTime: 0, endTime: 3, text: "Kosu dada, Akasa ye denghi?", translation: "Grandpa, where is Akasa?" },
      { id: "t6-2", startTime: 3, endTime: 7, text: "Akasa ye bou tibi kpo. Tẹmẹ bou ye bei.", translation: "Akasa is deep in the forest. It is a spirit place." },
      { id: "t6-3", startTime: 7, endTime: 11, text: "Arị mu digha-a? Arị di mi!", translation: "Can I go there? I want to see it!" },
      { id: "t6-4", startTime: 11, endTime: 15, text: "Ọdudu ẹrẹ kịịrịị ye-a? Tẹmẹbọ bi mene.", translation: "Is your heart pure? The spirits will test you." },
      { id: "t6-5", startTime: 15, endTime: 19, text: "Tịn kẹnị seri mene bei kpo — Ịzọn tịn.", translation: "A great tree stands there — the Ijaw Tree." },
      { id: "t6-6", startTime: 19, endTime: 23, text: "Kosu daubọ bei kpo gba mene wuni kpo.", translation: "Our ancestors speak to us through that tree." },
      { id: "t6-7", startTime: 23, endTime: 27, text: "Arị dila! Arị bẹẹlị mi.", translation: "I understand! I want to learn more." },
      { id: "t6-8", startTime: 27, endTime: 31, text: "Doo, tubou ẹrẹ. Torụ angọ kụlụ bogha.", translation: "Good, my child. The river does not forget its source." },
    ],
  },
  {
    id: "lesson-7", courseId: "course-2", title: "The Water Spirit Festival",
    description: "A boy and his father prepare for the Owuamapu festival — learning about masks, colors, and dance.",
    audioUrl: null, duration: 5, order: 2,
    transcript: [
      { id: "t7-1", startTime: 0, endTime: 3.5, text: "Dada, beingbai Owuamapu uge ye?", translation: "Dad, is today the Water Spirit festival?" },
      { id: "t7-2", startTime: 3.5, endTime: 7, text: "Heén! Bo, wuni mu.", translation: "Yes! Come, let us go." },
      { id: "t7-3", startTime: 7, endTime: 11, text: "Dada, ịndị anyẹn bei ye denghi kpọ?", translation: "Dad, why are they wearing fish masks?" },
      { id: "t7-4", startTime: 11, endTime: 15, text: "Owuamapu beni kpo timi. Ịndị ye woi leleị.", translation: "Water spirits live in the river. Fish are their sign." },
      { id: "t7-5", startTime: 15, endTime: 19, text: "Kwa-kwa aru bei — denghi kpọ kwa-kwa?", translation: "That red cloth — why is it red?" },
      { id: "t7-6", startTime: 19, endTime: 23, text: "Kwa-kwa ye gbasi. Pena-pena ye ọdudu kịịrịị.", translation: "Red means strength. White means a pure heart." },
      { id: "t7-7", startTime: 23, endTime: 27, text: "Dirimo-a? Dirimo ye dein mọ tẹmẹ.", translation: "And black? Black means night and spirits." },
      { id: "t7-8", startTime: 27, endTime: 31, text: "Arị sẹị mi! Arị Ịzọn ye!", translation: "I want to dance! I am Izon!" },
    ],
  },
  {
    id: "lesson-8", courseId: "course-3", title: "At the Market",
    description: "Practice bargaining, asking prices, and making transactions at a busy Izon market.",
    audioUrl: null, duration: 4, order: 1,
    transcript: [
      { id: "t8-1", startTime: 0, endTime: 3.5, text: "Baidẹ! Yebị ẹndẹị buru bei?", translation: "Good morning! How much is this yam?" },
      { id: "t8-2", startTime: 3.5, endTime: 7, text: "Akpa mọ ekise mọ. Buru bei pere ye.", translation: "Three hundred naira. This yam is big." },
      { id: "t8-3", startTime: 7, endTime: 11, text: "Garịn! Tubobị Iyerimọ!", translation: "That's expensive! Make it cheaper!" },
      { id: "t8-4", startTime: 11, endTime: 14, text: "Akpa. Ma akpaa bogha.", translation: "Two hundred. Not four hundred." },
      { id: "t8-5", startTime: 14, endTime: 18, text: "Doo! Okubo kọọr yọ kei ipiri.", translation: "Thank you! Give me my change." },
      { id: "t8-6", startTime: 18, endTime: 22, text: "Ịndị bei-a? Yebị ẹndẹị?", translation: "And this fish? How much is it?" },
      { id: "t8-7", startTime: 22, endTime: 26, text: "Okubo faa! Deinbai arị bo mene.", translation: "I have no money left! I'll come tomorrow." },
      { id: "t8-8", startTime: 26, endTime: 30, text: "Ese faa! Deinbai bo. Ụmbana!", translation: "No problem! Come tomorrow. Thank you!" },
    ],
  },
  { id: "lesson-9", courseId: "course-4", title: "Adé Goes to Market", description: "Follow young Adé as he greets neighbors on his way to Oja Oba, the king's market.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 30, order: 1, transcript: [{ id: "ty1", startTime: 0, endTime: 3.5, text: "Ọmọ ọja kan jí ni kutukutu owurọ", translation: "A trader's son woke up early one morning" }, { id: "ty2", startTime: 3.5, endTime: 7, text: "E kaaro o! ó kí iya rẹ", translation: "Good morning! he greeted his mother" }, { id: "ty3", startTime: 7, endTime: 11, text: "Bawo ni, ọmọ mi? iya rẹ bi", translation: "How are you, my child? his mother asked" }, { id: "ty4", startTime: 11, endTime: 15, text: "Mo wa daadaa. Mo fẹ lọ si ọja", translation: "I am fine. I want to go to the market" }, { id: "ty5", startTime: 15, endTime: 19, text: "Oruko mi ni Adé, ó sọ fun alajapa kan", translation: "My name is Adé, he told a stranger" }, { id: "ty6", startTime: 19, endTime: 23, text: "Nibo lo n lo? alajapa naa bi", translation: "Where are you going? the stranger asked" }, { id: "ty7", startTime: 23, endTime: 27, text: "Mo n lo si ọja. E se pupo!", translation: "I am going to the market. Thank you very much!" }, { id: "ty8", startTime: 27, endTime: 30, text: "O dabo! Adé yọ si ọja", translation: "Goodbye! Adé smiled as he reached the market" }] },
  { id: "lesson-10", courseId: "course-4", title: "Counting Cowries", description: "Adé's mother teaches him to count cowrie shells at her market stall.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-11", courseId: "course-4", title: "Adé Meets the Family", description: "Adé introduces a new friend to his large Yoruba family at a naming ceremony.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 220, order: 3, transcript: [] },
  { id: "lesson-12", courseId: "course-5", title: "The Patient Farmer", description: "An elder teaches patience through Yoruba proverbs as a young farmer struggles with his harvest.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 260, order: 1, transcript: [] },
  { id: "lesson-13", courseId: "course-5", title: "The Selfish Chief", description: "A village debates whether a chief who hoards grain deserves their loyalty — proverbs about community.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: 240, order: 2, transcript: [] },
  { id: "lesson-14", courseId: "course-6", title: "Chidi's New Yam Festival", description: "Chidi arrives at his grandmother's village for Iri Ji — learning greetings along the way.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", duration: 30, order: 1, transcript: [{ id: "ti1", startTime: 0, endTime: 3.5, text: "Ututu oma! Nne nne ya kpọrọ ya", translation: "Good morning! His grandmother called him" }, { id: "ti2", startTime: 3.5, endTime: 7, text: "Aha m bu Chidi, ọ zara", translation: "My name is Chidi, he answered" }, { id: "ti3", startTime: 7, endTime: 11, text: "Kedu ka i mere? Nne nne ya jụrụ", translation: "How are you? his grandmother asked" }, { id: "ti4", startTime: 11, endTime: 15, text: "A di m mma! Taa bụ ụbọchị Iri Ji", translation: "I am fine! Today is the New Yam Festival" }, { id: "ti5", startTime: 15, endTime: 19, text: "Dalu rinne, nne nne, maka nri a", translation: "Thank you very much, grandmother, for this food" }, { id: "ti6", startTime: 19, endTime: 23, text: "Ebee ka i na aga? Nne nne ya jụrụ", translation: "Where are you going? his grandmother asked" }, { id: "ti7", startTime: 23, endTime: 27, text: "Ana m aga n'ama — ebe ọgbakọ", translation: "I am going to the square — where the gathering is" }, { id: "ti8", startTime: 27, endTime: 30, text: "Ka omesia! Jee nke oma!", translation: "See you later! Go well!" }] },
  { id: "lesson-15", courseId: "course-6", title: "Sharing the Harvest", description: "Chidi helps count and divide yams for the feast — learning numbers through the harvest.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", duration: 185, order: 2, transcript: [] },
  { id: "lesson-16", courseId: "course-6", title: "The Family Gathering", description: "Chidi introduces visitors to his extended family at the Iri Ji feast.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: 210, order: 3, transcript: [] },
  { id: "lesson-17", courseId: "course-7", title: "The Scholar's Arrival", description: "A young scholar arrives in Kano and must greet the emir's court with proper respect.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 175, order: 1, transcript: [] },
  { id: "lesson-18", courseId: "course-7", title: "Trading at Kurmi Market", description: "Musa learns to count and bargain at Kano's ancient Kurmi market.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-19", courseId: "course-8", title: "Captain Baraka's Journey", description: "Follow Captain Baraka as he sails from Zanzibar and greets the fishermen of the coast.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 30, order: 1, transcript: [{ id: "ts1", startTime: 0, endTime: 3, text: "Habari za asubuhi! nahodha alisema", translation: "Good morning! the captain said" }, { id: "ts2", startTime: 3, endTime: 6.5, text: "Jina langu ni Baraka, kutoka Zanzibar", translation: "My name is Baraka, from Zanzibar" }, { id: "ts3", startTime: 6.5, endTime: 10, text: "Habari yako? mvuvi alimwuliza", translation: "How are you? a fisherman asked him" }, { id: "ts4", startTime: 10, endTime: 14, text: "Nzuri sana! Bahari ni shwari leo", translation: "Very well! The sea is calm today" }, { id: "ts5", startTime: 14, endTime: 18, text: "Asante sana kwa ukarimu wako", translation: "Thank you very much for your hospitality" }, { id: "ts6", startTime: 18, endTime: 22, text: "Unakwenda wapi na jahazi yako?", translation: "Where are you going with your dhow?" }, { id: "ts7", startTime: 22, endTime: 26, text: "Ninakwenda Lamu, kisha nyumbani", translation: "I am going to Lamu, then home" }, { id: "ts8", startTime: 26, endTime: 30, text: "Kwaheri! Safari njema!", translation: "Goodbye! Safe journey!" }] },
  { id: "lesson-20", courseId: "course-8", title: "Counting the Catch", description: "Baraka helps fishermen count their catch and divide it for the village.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 200, order: 2, transcript: [] },
  { id: "lesson-21", courseId: "course-8", title: "The Fisherman's Family", description: "Baraka joins a fisherman's family for dinner and learns how they address each other.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", duration: 210, order: 3, transcript: [] },
  { id: "lesson-22", courseId: "course-9", title: "The Teacher and the Student", description: "A Swahili teacher shares proverbs about wisdom with a struggling student.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", duration: 250, order: 1, transcript: [] },
  { id: "lesson-23", courseId: "course-9", title: "The Two Neighbors", description: "Two neighbors argue and reconcile — learning Swahili proverbs about unity.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", duration: 240, order: 2, transcript: [] },
  { id: "lesson-24", courseId: "course-10", title: "Maryam's Coffee Ceremony", description: "Maryam invites her neighbor for a traditional Ethiopian coffee ceremony — buna.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", duration: 30, order: 1, transcript: [{ id: "ta1", startTime: 0, endTime: 3, text: "እንደምን አደርክ! ጎረቤት ጠራ", translation: "Good morning! a neighbor called out" }, { id: "ta2", startTime: 3, endTime: 6.5, text: "ስሜ ማርያም ነው። ቡና ፈልተሽ?", translation: "My name is Maryam. Would you like coffee?" }, { id: "ta3", startTime: 6.5, endTime: 10, text: "እንዴት ነህ? ጎረቤት ጠየቀ", translation: "How are you? the neighbor asked" }, { id: "ta4", startTime: 10, endTime: 14, text: "ደህና ነኝ! ቡና ሲፈላ ጥሩ ሽታ አለው", translation: "I am fine! The coffee smells wonderful as it brews" }, { id: "ta5", startTime: 14, endTime: 18, text: "አመሰግናለሁ! ይህ የቡና ሥርዓት ቆንጆ ነው", translation: "Thank you! This coffee ceremony is beautiful" }, { id: "ta6", startTime: 18, endTime: 22, text: "ወዴት ነው የምትሄደው? ከቡና በኋላ?", translation: "Where are you going after coffee?" }, { id: "ta7", startTime: 22, endTime: 26, text: "ወደ ገበያ እየሄድኩ ነው — ቅመማ ቅመም ለመግዛት", translation: "I am going to the market — to buy spices" }, { id: "ta8", startTime: 26, endTime: 30, text: "ደህና ሁን! ቡና ደግሞ ጠብቂኝ!", translation: "Goodbye! Save me coffee again!" }] },
  { id: "lesson-25", courseId: "course-10", title: "The Spice Market", description: "Maryam bargains for spices at the merkato — learning to count in Amharic.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-26", courseId: "course-10", title: "Gathering for Timkat", description: "Maryam's family gathers for the Timkat festival — introducing family members.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 205, order: 3, transcript: [] },
  { id: "lesson-27", courseId: "course-11", title: "Ananse Visits Grandmother", description: "The trickster Ananse visits his grandmother — learn greetings through an Akan folktale.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 30, order: 1, transcript: [{ id: "tk1", startTime: 0, endTime: 3, text: "Maakye, Nana! Ananse kae", translation: "Good morning, Grandmother! Ananse said" }, { id: "tk2", startTime: 3, endTime: 6.5, text: "Me din de Ananse, kwaku ananse", translation: "My name is Ananse, the clever spider" }, { id: "tk3", startTime: 6.5, endTime: 10, text: "Wo ho te sɛn? Nana bisaa", translation: "How are you? Grandmother asked" }, { id: "tk4", startTime: 10, endTime: 14, text: "Me ho yɛ! Nanso ɔkɔm de me", translation: "I am fine! But I am hungry" }, { id: "tk5", startTime: 14, endTime: 18, text: "Medaase paa, Nana, sɛ wode aduane maa me", translation: "Thank you very much, Grandmother, for giving me food" }, { id: "tk6", startTime: 18, endTime: 22, text: "Wo rekɔ he? Nana bisaa no", translation: "Where are you going? Grandmother asked him" }, { id: "tk7", startTime: 22, endTime: 26, text: "Merekɔ fie, na ade resa", translation: "I am going home, it is getting dark" }, { id: "tk8", startTime: 26, endTime: 30, text: "Nante yie, Ananse! Nana kae", translation: "Safe journey, Ananse! Grandmother said" }] },
  { id: "lesson-28", courseId: "course-11", title: "Ananse Counts His Treasures", description: "Ananse tries to count his treasures but keeps losing track — learning numbers in Twi.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-29", courseId: "course-11", title: "Ananse and the Abusua", description: "Ananse discovers the meaning of abusua — family — when he needs help carrying food home.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: 215, order: 3, transcript: [] },
  { id: "lesson-30", courseId: "course-12", title: "The Griot's Welcome", description: "A griot welcomes travelers to a teranga feast — learn Wolof greetings through Senegalese hospitality.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", duration: 30, order: 1, transcript: [{ id: "tw1", startTime: 0, endTime: 3.5, text: "Nanga def? Gewel bi ne", translation: "How are you? the griot said" }, { id: "tw2", startTime: 3.5, endTime: 7, text: "Maa ngi fi rekk. Teranga la", translation: "I am fine. This is hospitality" }, { id: "tw3", startTime: 7, endTime: 11, text: "Naka nga tudd? Li ci nekkoon bi", translation: "What is your name? the host asked" }, { id: "tw4", startTime: 11, endTime: 15, text: "Maa ngi tudd Ousmane. Sama kër Dakar la", translation: "My name is Ousmane. My home is Dakar" }, { id: "tw5", startTime: 15, endTime: 19, text: "Jërëjëf ci teranga bi!", translation: "Thank you for this hospitality!" }, { id: "tw6", startTime: 19, endTime: 23, text: "Fan nga dem? Gewel bi laaj", translation: "Where are you going? the griot asked" }, { id: "tw7", startTime: 23, endTime: 27, text: "Damay dem kër, wànte dinaa dellu", translation: "I am going home, but I will return" }, { id: "tw8", startTime: 27, endTime: 30, text: "Ba beneen, saai! the griot sang", translation: "See you again, friend! the griot sang" }] },
  { id: "lesson-31", courseId: "course-12", title: "Haggling in Sandaga", description: "A visitor learns to count and bargain at Dakar's famous Sandaga market.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", duration: 185, order: 2, transcript: [] },
  { id: "lesson-32", courseId: "course-13", title: "Youssef in Old Cairo", description: "Youssef visits a cafe in Cairo's old quarter and chats with the owner — learning greetings.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", duration: 30, order: 1, transcript: [{ id: "tae1", startTime: 0, endTime: 3, text: "صباح الخير! قال المسافر لصاحب القهوة", translation: "Good morning! the traveler said to the cafe owner" }, { id: "tae2", startTime: 3, endTime: 6.5, text: "اسمي يوسف. أنا من الإسكندرية", translation: "My name is Youssef. I am from Alexandria" }, { id: "tae3", startTime: 6.5, endTime: 10, text: "إزيك يا يوسف? صاحب القهوة سأل", translation: "How are you, Youssef? the cafe owner asked" }, { id: "tae4", startTime: 10, endTime: 14, text: "أنا كويس! القاهرة جميلة", translation: "I am fine! Cairo is beautiful" }, { id: "tae5", startTime: 14, endTime: 18, text: "شكراً جزيلاً على الشاي ده", translation: "Thank you very much for this tea" }, { id: "tae6", startTime: 18, endTime: 22, text: "رايح فين دلوقتي? صاحب القهوة سأل", translation: "Where are you going now? the cafe owner asked" }, { id: "tae7", startTime: 22, endTime: 26, text: "أنا رايح خان الخليلي — السوق القديم", translation: "I am going to Khan el-Khalili — the old market" }, { id: "tae8", startTime: 26, endTime: 30, text: "مع السلامة! ارجع تاني!", translation: "Goodbye! Come back again!" }] },
  { id: "lesson-33", courseId: "course-13", title: "Bargaining in Khan el-Khalili", description: "Youssef haggles for souvenirs in Cairo's oldest bazaar — counting and prices in Egyptian Arabic.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 195, order: 2, transcript: [] },
  { id: "lesson-34", courseId: "course-13", title: "Iftar with the Family", description: "Youssef joins an Egyptian family for iftar — learning family words during Ramadan.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: 210, order: 3, transcript: [] },
  { id: "lesson-35", courseId: "course-14", title: "The Camel Herder's Welcome", description: "A young herder greets travelers joining his family's camel caravan across the Somali plains.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: 180, order: 1, transcript: [] },
  { id: "lesson-36", courseId: "course-14", title: "Counting the Herd", description: "Abdi teaches a traveler to count camels and goats in Somali.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 185, order: 2, transcript: [] },
  { id: "lesson-37", courseId: "course-15", title: "Under the Palaver Tree", description: "Two friends meet under the village palaver tree and exchange the elaborate Bambara greetings.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", duration: 185, order: 1, transcript: [] },
  { id: "lesson-38", courseId: "course-15", title: "The Millet Harvest", description: "Moussa helps count sacks of millet during harvest — learning Bambara numbers.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-39", courseId: "course-16", title: "Grandmother's Mountain Home", description: "A grandchild arrives at an Amazigh village in the Atlas mountains — learning Tamazight greetings.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", duration: 180, order: 1, transcript: [] },
  { id: "lesson-40", courseId: "course-16", title: "Counting Olives in the Grove", description: "Yidir and his grandmother count the olive harvest — learning Tamazight numbers.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-41", courseId: "course-17", title: "Umuganda Morning", description: "A newcomer joins an umuganda community work day — learning Kinyarwanda greetings.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", duration: 180, order: 1, transcript: [] },
  { id: "lesson-42", courseId: "course-17", title: "Planting Together", description: "Uwimana and Keza count seedlings during an umuganda tree-planting — learning numbers.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: 185, order: 2, transcript: [] },
  { id: "lesson-43", courseId: "course-18", title: "The Drummer's Festival", description: "A young drummer prepares for the Hogbetsotso festival — learning Ewe greetings.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: 185, order: 1, transcript: [] },
  { id: "lesson-44", courseId: "course-18", title: "Counting Drumbeats", description: "Kofi's teacher helps him keep rhythm by counting beats in Ewe.", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: 190, order: 2, transcript: [] },
  { id: "lesson-45", courseId: "course-19", title: "Vowel Harmony", description: "A grandmother teaches her grandchild to read Izon by exploring how vowels work together in the Woyengi creation story.", audioUrl: null, duration: null, order: 1, transcript: [] },
  { id: "lesson-46", courseId: "course-19", title: "Consonants & Digraphs", description: "Grandmother and grandchild explore Izon consonants through a story about the Ekine masquerade preparations.", audioUrl: null, duration: null, order: 2, transcript: [] },
  {
    id: "lesson-47", courseId: "course-19", title: "Nasalized & Long Vowels",
    description: "By the river at dusk, grandmother teaches how nasal sounds and long vowels carry meaning in Izon songs and stories.",
    audioUrl: null, duration: null, order: 3,
    transcript: [
      { id: "t47-1", startTime: 0, endTime: 5, text: "bụmọụ", translation: "sand bank" },
      { id: "t47-2", startTime: 5, endTime: 10, text: "dụnọụ", translation: "lake" },
      { id: "t47-3", startTime: 10, endTime: 15, text: "bingha", translation: "not many; not plenty" },
      { id: "t47-4", startTime: 15, endTime: 20, text: "pingha", translation: "not congested" },
    ],
  },
  { id: "lesson-48", courseId: "course-19", title: "Vowel Sequences", description: "Grandmother and grandchild paddle their canoe while practicing the vowel pairs that make Izon unique.", audioUrl: null, duration: null, order: 4, transcript: [] },
  { id: "lesson-49", courseId: "course-20", title: "Counting 1–20", description: "A father teaches his son to count fish from their catch, using both modern and traditional Izon numbers.", audioUrl: null, duration: null, order: 1, transcript: [] },
  {
    id: "lesson-50", courseId: "course-20", title: "Counting 21–100",
    description: "Father and son count a large catch of fish, learning the traditional Izon system of counting by twenties.",
    audioUrl: null, duration: null, order: 2,
    transcript: [
      { id: "t50-61", startTime: 0, endTime: 2, text: "tará sí mọ kẹnị mọ", translation: "sixty-one" },
      { id: "t50-62", startTime: 2, endTime: 4, text: "tará sí mọ mamụ mọ", translation: "sixty-two" },
      { id: "t50-63", startTime: 4, endTime: 6, text: "tará sí mọ taárụ mọ", translation: "sixty-three" },
      { id: "t50-64", startTime: 6, endTime: 8, text: "tará sí mọ nein mọ", translation: "sixty-four" },
      { id: "t50-65", startTime: 8, endTime: 10, text: "tará sí mọ sọọnrọn mọ", translation: "sixty-five" },
      { id: "t50-66", startTime: 10, endTime: 12, text: "tará sí mọ sondie mọ", translation: "sixty-six" },
      { id: "t50-67", startTime: 12, endTime: 14, text: "tará sí mọ sọnọma mọ", translation: "sixty-seven" },
      { id: "t50-68", startTime: 14, endTime: 16, text: "tará sí mọ niina mọ", translation: "sixty-eight" },
      { id: "t50-69", startTime: 16, endTime: 18, text: "tará sí mọ isé mọ", translation: "sixty-nine" },
      { id: "t50-70", startTime: 18, endTime: 20, text: "tará sí mọ oyi mọ", translation: "seventy (three twenties and ten)" },
      { id: "t50-71", startTime: 20, endTime: 22, text: "tará sí mọ oyi kẹnị feni mọ", translation: "seventy-one" },
      { id: "t50-72", startTime: 22, endTime: 24, text: "tará sí mọ oyi mamụ feni mọ", translation: "seventy-two" },
      { id: "t50-73", startTime: 24, endTime: 26, text: "tará sí mọ oyi taárụ feni mọ", translation: "seventy-three" },
      { id: "t50-74", startTime: 26, endTime: 28, text: "tará sí mọ oyi nein feni mọ", translation: "seventy-four" },
      { id: "t50-75", startTime: 28, endTime: 30, text: "tará si mọ oyi sọọnrọn feni mọ", translation: "seventy-five (also: tara si mọ die mọ)" },
      { id: "t50-76", startTime: 30, endTime: 32, text: "tará sí mọ oyi sondie feni mọ", translation: "seventy-six" },
      { id: "t50-77", startTime: 32, endTime: 34, text: "tará sí mọ oyi sọnọma feni mọ", translation: "seventy-seven" },
      { id: "t50-78", startTime: 34, endTime: 36, text: "tará sí mọ oyi niina feni mọ", translation: "seventy-eight" },
      { id: "t50-79", startTime: 36, endTime: 38, text: "tará sí mọ oyi isé feni mọ", translation: "seventy-nine" },
      { id: "t50-80", startTime: 38, endTime: 40, text: "níá sí", translation: "eighty (four twenties)" },
      { id: "t50-81", startTime: 40, endTime: 42, text: "níá si mọ kẹnị mọ", translation: "eighty-one" },
      { id: "t50-82", startTime: 42, endTime: 44, text: "níá sí mọ mamụ mọ", translation: "eighty-two" },
      { id: "t50-83", startTime: 44, endTime: 46, text: "níá sí mọ taárụ mọ", translation: "eighty-three" },
      { id: "t50-84", startTime: 46, endTime: 48, text: "níá sí mọ nein mọ", translation: "eighty-four" },
      { id: "t50-85", startTime: 48, endTime: 50, text: "níá sí mọ sọọnrọn mọ", translation: "eighty-five" },
      { id: "t50-86", startTime: 50, endTime: 52, text: "níá sí mọ sondie mọ", translation: "eighty-six" },
      { id: "t50-87", startTime: 52, endTime: 54, text: "níá sí mọ sọnọma mọ", translation: "eighty-seven" },
      { id: "t50-88", startTime: 54, endTime: 56, text: "níá sí mọ niina mọ", translation: "eighty-eight" },
      { id: "t50-89", startTime: 56, endTime: 58, text: "níá sí mọ isé mọ", translation: "eighty-nine" },
      { id: "t50-90", startTime: 58, endTime: 60, text: "níá sí mọ oyi mọ", translation: "ninety" },
      { id: "t50-91", startTime: 60, endTime: 62, text: "níá sí mọ oyi kẹnị feni mọ", translation: "ninety-one" },
      { id: "t50-92", startTime: 62, endTime: 64, text: "níá sí mọ oyi mamụ feni mọ", translation: "ninety-two" },
      { id: "t50-93", startTime: 64, endTime: 66, text: "níá sí mọ oyi taárụ feni mọ", translation: "ninety-three" },
      { id: "t50-94", startTime: 66, endTime: 68, text: "níá sí mọ oyi nein feni mọ", translation: "ninety-four" },
      { id: "t50-95", startTime: 68, endTime: 70, text: "níá sí mọ oyi sọọnrọn feni mọ", translation: "ninety-five (also: níá si mọ die mọ)" },
      { id: "t50-96", startTime: 70, endTime: 72, text: "níá sí mọ oyi sondie feni mọ", translation: "ninety-six" },
      { id: "t50-97", startTime: 72, endTime: 74, text: "níá sí mọ oyi sọnọma feni mọ", translation: "ninety-seven" },
      { id: "t50-98", startTime: 74, endTime: 76, text: "níá sí mọ oyi niina feni mọ", translation: "ninety-eight" },
      { id: "t50-99", startTime: 76, endTime: 78, text: "níá sí mọ oyi isé feni mọ", translation: "ninety-nine" },
      { id: "t50-100", startTime: 78, endTime: 80, text: "sọọnran sí", translation: "one hundred (five twenties)" },
    ],
  },
  { id: "lesson-51", courseId: "course-20", title: "Money & Market", description: "Father and son take their fish to market, learning the traditional akpa money system and how to bargain.", audioUrl: null, duration: null, order: 3, transcript: [] },
  {
    id: "lesson-52", courseId: "course-3", title: "Where Are You From?",
    description: "Practice asking and answering questions about hometown, nationality, age, and occupation using interrogative pronouns.",
    audioUrl: null, duration: 5, order: 2,
    transcript: [
      { id: "t52-1", startTime: 0, endTime: 4, text: "E baịdẹ, Kịmịowei Adokeme?", translation: "Good afternoon, Mr Adokeme?" },
      { id: "t52-2", startTime: 4, endTime: 8, text: "E baịdẹ, Kịmịowei Pẹrezi?", translation: "Good afternoon, Mr Pẹrezi?" },
      { id: "t52-3", startTime: 8, endTime: 13, text: "Teyi ke enị are a?", translation: "What is your name, please?" },
      { id: "t52-4", startTime: 13, endTime: 17, text: "Enị aremi Pịrịye Adokeme. Enị are ba o.", translation: "My name is Pịrịye Adokeme. Please call me Pịrịye." },
      { id: "t52-5", startTime: 17, endTime: 22, text: "Emịnị tị ama ye a?", translation: "Where are you from?" },
      { id: "t52-6", startTime: 22, endTime: 27, text: "Emịnị Isampou ye.", translation: "I am from Isampou." },
      { id: "t52-7", startTime: 27, endTime: 32, text: "Emịnị tị ibe ye a?", translation: "What country are you from?" },
      { id: "t52-8", startTime: 32, endTime: 37, text: "Emịnị Naiziria ye. Emịnị Ịzọn ye.", translation: "I am from Nigeria. I am Izon." },
      { id: "t52-9", startTime: 37, endTime: 42, text: "Endẹ na kurai kị emu baidẹ?", translation: "How old are you?" },
      { id: "t52-10", startTime: 42, endTime: 47, text: "Emịnị si oyia kurai feni kị baidẹ.", translation: "I am thirty years old." },
      { id: "t52-11", startTime: 47, endTime: 52, text: "Teyọ kị emu eyerinmịnị ya?", translation: "Where do you work?" },
      { id: "t52-12", startTime: 52, endTime: 58, text: "Opolo-a Yenagoa Cọmisọna-otu egede kị emu eyerinmịnị.", translation: "I work at the Yenagoa Commissioner's office." },
    ],
  },
  {
    id: "lesson-53", courseId: "course-3", title: "Introducing Yourself",
    description: "Learn to introduce yourself fully in Izon — name, hometown, and profession — through a real dialogue and self-introduction phrases.",
    audioUrl: null, duration: 5, order: 3,
    transcript: [
      { id: "t53-1", startTime: 0, endTime: 4, text: "Tị eyọ kị emu duo boma?", translation: "Where are you from?" },
      { id: "t53-2", startTime: 4, endTime: 9, text: "Ịsampọu kị emu duo bomị. Ịsampọu Bayelsa Siteti ka emi.", translation: "I'm from Isampou, in Bayelsa State." },
      { id: "t53-3", startTime: 9, endTime: 15, text: "Ịsampọu tị eyo ka emi ya? O Yenagoa mọ naịn emi ya?", translation: "Where is Isampou? Is it near Yenagoa?" },
      { id: "t53-4", startTime: 15, endTime: 20, text: "Inyo (E). Omịnị tamụ akụ ka emi.", translation: "Yes, it is. It's close to the East." },
      { id: "t53-5", startTime: 20, endTime: 25, text: "O yalịyalị emi?", translation: "Is it neat?" },
      { id: "t53-6", startTime: 25, endTime: 30, text: "E o yalịyalị emi. O yalịyalị kụrọmọ emi.", translation: "Yes, it is. It is very clean." },
      { id: "t53-7", startTime: 30, endTime: 36, text: "Emịnị Erearau Doris Adokeme. Emịnị ogulapẹlẹ-ere.", translation: "I am Mrs Doris Adokeme. I am a judge." },
      { id: "t53-8", startTime: 36, endTime: 42, text: "Emịnị kịmịowei Tamara Adokeme. Emịnị komputa kịmị.", translation: "I am Mr Tamara Adokeme. I am a computer scientist." },
      { id: "t53-9", startTime: 42, endTime: 48, text: "Emịnị kịmịowei Pịrịye Adokeme. Emịnị oloo owei.", translation: "I am Mr Pịrịye Adokeme. I am a lawyer." },
      { id: "t53-10", startTime: 48, endTime: 54, text: "Emịnị Erearau Vivian Adokeme. Emịnị dọnzuọ-ere.", translation: "I am Vivian Adokeme. I am a medical doctor." },
    ],
  },
];

// ---------------------------------------------------------------------------
// UGC seed data
// ---------------------------------------------------------------------------
const PLACEHOLDER_USER_ID = "00000000-0000-0000-0000-000000000000";

const SEED_FEED = [
  { type: "lesson_completed" as const, title: "Completed Greetings & Introductions", description: "Finished the first lesson in Izon Basics", userName: "Tamara A.", createdAt: new Date("2025-01-15T10:30:00Z"), likesCount: 5, commentsCount: 2 },
  { type: "contribution" as const, title: "New audio recording", description: "Contributed a pronunciation guide for common Yoruba greetings", userName: "Ebi O.", createdAt: new Date("2025-01-14T16:00:00Z"), likesCount: 12, commentsCount: 4, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { type: "achievement" as const, title: "7-day streak!", description: "Reached a 7-day learning streak across Izon and Yoruba", userName: "Diepreye K.", createdAt: new Date("2025-01-13T09:00:00Z"), likesCount: 20, commentsCount: 8 },
  { type: "community" as const, title: "Study group forming", description: "Looking for learners to practice conversational Igbo together on weekends", userName: "Seiyefa T.", createdAt: new Date("2025-01-12T12:00:00Z"), likesCount: 15, commentsCount: 11 },
  { type: "lesson_completed" as const, title: "Completed The Tortoise and the River", description: "Loved this traditional Izon folktale! The narrator's voice is captivating.", userName: "Boma D.", createdAt: new Date("2025-01-11T18:00:00Z"), likesCount: 8, commentsCount: 3 },
  { type: "contribution" as const, title: "Hausa translation added", description: "Translated 15 common phrases into Hausa with audio recordings", userName: "Amina B.", createdAt: new Date("2025-01-10T11:00:00Z"), likesCount: 18, commentsCount: 6, audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

const SEED_COMMENTS: { feedIndex: number; userName: string; text: string; createdAt: Date }[] = [
  { feedIndex: 0, userName: "Ebi O.", text: "Great job! Keep it up!", createdAt: new Date("2025-01-15T11:00:00Z") },
  { feedIndex: 0, userName: "Diepreye K.", text: "The greetings lesson is one of my favourites", createdAt: new Date("2025-01-15T12:30:00Z") },
  { feedIndex: 1, userName: "Tamara A.", text: "This is so helpful, thank you!", createdAt: new Date("2025-01-14T17:00:00Z") },
  { feedIndex: 1, userName: "Seiyefa T.", text: "Your pronunciation is really clear", createdAt: new Date("2025-01-14T18:00:00Z") },
  { feedIndex: 1, userName: "Boma D.", text: "Can you do one for Igbo greetings too?", createdAt: new Date("2025-01-14T19:00:00Z") },
  { feedIndex: 1, userName: "Amina B.", text: "Shared this with my study group!", createdAt: new Date("2025-01-14T20:00:00Z") },
  { feedIndex: 2, userName: "Tamara A.", text: "Wow 7 days, amazing consistency!", createdAt: new Date("2025-01-13T10:00:00Z") },
  { feedIndex: 2, userName: "Ebi O.", text: "Inspiring! I'm on day 3 myself", createdAt: new Date("2025-01-13T11:00:00Z") },
  { feedIndex: 3, userName: "Diepreye K.", text: "Count me in! What time on weekends?", createdAt: new Date("2025-01-12T13:00:00Z") },
  { feedIndex: 3, userName: "Boma D.", text: "I'd love to join, I'm learning Igbo basics", createdAt: new Date("2025-01-12T14:00:00Z") },
  { feedIndex: 4, userName: "Seiyefa T.", text: "The narrator is incredible!", createdAt: new Date("2025-01-11T19:00:00Z") },
  { feedIndex: 5, userName: "Diepreye K.", text: "This is a huge contribution, thank you Amina!", createdAt: new Date("2025-01-10T12:00:00Z") },
  { feedIndex: 5, userName: "Tamara A.", text: "The audio quality is perfect", createdAt: new Date("2025-01-10T13:00:00Z") },
];

// ---------------------------------------------------------------------------
// Helper: batch insert in chunks to avoid DB limits
// ---------------------------------------------------------------------------
async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  rows: T[],
  chunkSize = 100
) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await db.insert(table).values(chunk as any).onConflictDoNothing();
  }
}

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------
async function seed() {
  console.log("Seeding database...");

  // 1. Languages
  console.log("  Inserting languages...");
  await batchInsert(languages, SEED_LANGUAGES);

  // 2. Courses — upsert so lessonsCount and descriptions stay current
  console.log("  Inserting courses...");
  for (const course of SEED_COURSES) {
    await db.insert(courses).values(course).onConflictDoUpdate({
      target: courses.id,
      set: {
        title: course.title,
        description: course.description,
        level: course.level,
        lessonsCount: course.lessonsCount,
        order: course.order,
      },
    });
  }

  // 3. Lessons + 4. Transcript segments
  // Lessons are upserted so content edits are reflected on re-seed.
  // Transcript segments have no stable natural key (auto UUID), so we
  // delete and re-insert them to keep them in sync with the lesson data.
  console.log("  Inserting lessons and transcripts...");
  for (const lesson of SEED_LESSONS) {
    const { transcript, ...lessonData } = lesson;

    await db.insert(lessons).values(lessonData).onConflictDoUpdate({
      target: lessons.id,
      set: {
        title: lessonData.title,
        description: lessonData.description,
        audioUrl: lessonData.audioUrl,
        duration: lessonData.duration,
        order: lessonData.order,
      },
    });

    // Always replace transcript segments so edits are reflected
    await db.delete(transcriptSegments).where(eq(transcriptSegments.lessonId, lesson.id));
    if (transcript.length > 0) {
      const segments = transcript.map((seg, idx) => ({
        lessonId: lesson.id,
        startTime: seg.startTime,
        endTime: seg.endTime,
        text: seg.text,
        translation: seg.translation ?? null,
        order: idx,
      }));
      await batchInsert(transcriptSegments, segments);
    }
  }

  // 5. Dictionary entries
  console.log("  Inserting dictionary entries...");
  const allDictEntries = [
    ...IZON_DICTIONARY,
    ...YORUBA_DICTIONARY,
    ...IGBO_DICTIONARY,
    ...HAUSA_DICTIONARY,
    ...SWAHILI_DICTIONARY,
    ...AMHARIC_DICTIONARY,
    ...AKAN_DICTIONARY,
    ...WOLOF_DICTIONARY,
    ...ARABIC_EGYPTIAN_DICTIONARY,
    ...SOMALI_DICTIONARY,
    ...BAMBARA_DICTIONARY,
    ...TAMAZIGHT_DICTIONARY,
    ...KINYARWANDA_DICTIONARY,
    ...EWE_DICTIONARY,
    ...OROMO_DICTIONARY,
    ...SHONA_DICTIONARY,
  ];
  const dictRows = allDictEntries.map((e) => ({
    id: e.id,
    languageId: e.languageId,
    word: e.word,
    english: e.english,
    category: e.category,
    pronunciation: e.pronunciation ?? null,
    example: e.example ?? null,
    exampleTranslation: e.exampleTranslation ?? null,
    audioUrl: typeof e.audioUrl === "string" ? e.audioUrl : null,
    contributorName: e.contributorName ?? null,
    contributorId: e.contributorId ?? null,
  }));
  await batchInsert(dictionaryEntries, dictRows);

  // 6. Proverbs
  console.log("  Inserting proverbs...");
  const allProverbs = [
    ...IZON_PROVERBS,
    ...YORUBA_PROVERBS,
    ...AKAN_PROVERBS,
    ...IGBO_PROVERBS,
    ...HAUSA_PROVERBS,
    ...SWAHILI_PROVERBS,
    ...AMHARIC_PROVERBS,
    ...WOLOF_PROVERBS,
    ...ARABIC_EGYPTIAN_PROVERBS,
    ...SOMALI_PROVERBS,
    ...BAMBARA_PROVERBS,
    ...TAMAZIGHT_PROVERBS,
    ...KINYARWANDA_PROVERBS,
    ...EWE_PROVERBS,
  ];
  const proverbRows = allProverbs.map((p) => ({
    id: p.id,
    languageId: p.languageId,
    text: p.text,
    translation: p.translation,
    meaning: p.meaning,
    literal: p.literal ?? null,
    context: p.context ?? null,
    tags: p.tags ?? null,
  }));
  await batchInsert(proverbs, proverbRows);

  // 7. Cultural content + key terms
  console.log("  Inserting cultural content...");
  const allCultural = [
    ...IZON_CULTURAL,
    ...YORUBA_CULTURAL,
    ...AKAN_CULTURAL,
    ...IGBO_CULTURAL,
    ...HAUSA_CULTURAL,
    ...SWAHILI_CULTURAL,
    ...AMHARIC_CULTURAL,
    ...WOLOF_CULTURAL,
    ...ARABIC_EGYPTIAN_CULTURAL,
    ...SOMALI_CULTURAL,
    ...BAMBARA_CULTURAL,
    ...TAMAZIGHT_CULTURAL,
    ...KINYARWANDA_CULTURAL,
    ...EWE_CULTURAL,
  ];
  const culturalRows = allCultural.map((c) => ({
    id: c.id,
    languageId: c.languageId,
    category: c.category,
    title: c.title,
    description: c.description,
    imageEmoji: c.imageEmoji,
  }));
  await batchInsert(culturalContent, culturalRows);

  const keyTermRows = allCultural.flatMap((c) =>
    (c.keyTerms ?? []).map((term, idx) => ({
      culturalContentId: c.id,
      word: term.word,
      english: term.english,
      order: idx,
    }))
  );
  await batchInsert(culturalKeyTerms, keyTermRows);

  // 8. Sentence templates
  console.log("  Inserting sentence templates...");
  const allSentences = [
    ...IZON_SENTENCES,
    ...IGBO_SENTENCES,
    ...HAUSA_SENTENCES,
    ...SWAHILI_SENTENCES,
    ...AMHARIC_SENTENCES,
    ...WOLOF_SENTENCES,
    ...ARABIC_EGYPTIAN_SENTENCES,
    ...SOMALI_SENTENCES,
    ...BAMBARA_SENTENCES,
    ...TAMAZIGHT_SENTENCES,
    ...KINYARWANDA_SENTENCES,
    ...EWE_SENTENCES,
  ];
  const sentenceRows = allSentences.map((s) => ({
    id: s.id,
    languageId: s.languageId,
    sentence: s.sentence,
    answer: s.answer,
    englishSentence: s.englishSentence,
  }));
  await batchInsert(sentenceTemplates, sentenceRows);

  // 9. UGC: placeholder user + feed + comments
  console.log("  Seeding UGC (feed & comments)...");
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.id, PLACEHOLDER_USER_ID))
    .limit(1);

  if (!existing) {
    await db.insert(users).values({
      id: PLACEHOLDER_USER_ID,
      clerkId: "seed_placeholder",
      name: "Seed User",
      email: "seed@example.com",
    });
  }

  const insertedFeedItems: { id: string }[] = [];
  for (const item of SEED_FEED) {
    const [inserted] = await db
      .insert(feedItems)
      .values({ userId: PLACEHOLDER_USER_ID, ...item })
      .returning({ id: feedItems.id });
    insertedFeedItems.push(inserted!);
  }

  for (const comment of SEED_COMMENTS) {
    const feedItem = insertedFeedItems[comment.feedIndex];
    if (feedItem) {
      await db.insert(comments).values({
        userId: PLACEHOLDER_USER_ID,
        feedItemId: feedItem.id,
        userName: comment.userName,
        text: comment.text,
        createdAt: comment.createdAt,
      });
    }
  }

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
