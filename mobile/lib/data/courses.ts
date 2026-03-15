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
  titleFr?: string;
  description: string;
  descriptionFr?: string;
  level: string;
  lessonsCount: number;
  order: number;
  courseType: CourseType;
};

export const COURSES: CourseEntry[] = [
  // Izon (ordered: first_words → sound_script → numbers_trade → communicative → oral_tradition)
  {
    id: "course-1",  languageId: "izon", order: 1, level: "beginner", lessonsCount: 5, courseType: "first_words",
    title: "Emi — First Words",
    titleFr: "Emi — Premiers Mots",
    description: "Begin with greetings, names, and introductions — the words that open doors and build belonging in Izon community.",
    descriptionFr: "Commencez par les salutations, les noms et les présentations — les mots qui ouvrent les portes et créent un sentiment d'appartenance dans la communauté Izon.",
  },
  {
    id: "course-19", languageId: "izon", order: 2, level: "beginner", lessonsCount: 4, courseType: "sound_script",
    title: "Izọn Fiye — Sounds & Script",
    titleFr: "Izọn Fiye — Sons et Écriture",
    description: "Master the phoneme inventory of Izon — vowel harmony, tonal contrasts, consonant digraphs, and the orthographic conventions used in written Izon.",
    descriptionFr: "Maîtrisez l'inventaire phonémique de l'Izon — harmonie vocalique, contrastes tonaux, digrammes consonantiques et les conventions orthographiques de l'Izon écrit.",
  },
  {
    id: "course-20", languageId: "izon", order: 3, level: "beginner", lessonsCount: 3, courseType: "numbers_trade",
    title: "Kịẹn mọ Okubo — Counting & Trade",
    titleFr: "Kịẹn mọ Okubo — Chiffres et Commerce",
    description: "Learn the traditional Izon vigesimal counting system, market numerals, money vocabulary, and the akpa unit used in trade.",
    descriptionFr: "Apprenez le système de numération vigésimal traditionnel Izon, les chiffres du marché, le vocabulaire de l'argent et l'unité akpa utilisée dans le commerce.",
  },
  {
    id: "course-3",  languageId: "izon", order: 4, level: "beginner", lessonsCount: 3, courseType: "communicative",
    title: "Izọn Gba — Speaking Izon Well",
    titleFr: "Izọn Gba — Bien parler l'Izon",
    description: "Practise extended dialogues, social registers, and the politeness formulas that mark respectful speech across age and community contexts.",
    descriptionFr: "Pratiquez des dialogues étendus, les registres sociaux et les formules de politesse qui caractérisent un discours respectueux selon l'âge et le contexte communautaire.",
  },
  {
    id: "course-2",  languageId: "izon", order: 5, level: "intermediate", lessonsCount: 5, courseType: "oral_tradition",
    title: "Teme Gba — The Old Stories",
    titleFr: "Teme Gba — Les Vieux Contes",
    description: "Listen to traditional Izon folktales, praise poetry, and proverbs rooted in the rivers, forests, and spiritual memory of the Niger Delta.",
    descriptionFr: "Écoutez les contes traditionnels Izon, la poésie élogieuse et les proverbes enracinés dans les rivières, les forêts et la mémoire spirituelle du delta du Niger.",
  },

  // Yoruba
  {
    id: "course-4",  languageId: "yoruba", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Yoruba — First Words",
    titleFr: "Yoruba — Premiers Mots",
    description: "Open with the greetings and self-introductions that signal respect and community in Yorùbá — the foundation for every conversation.",
    descriptionFr: "Débutez par les salutations et les présentations qui expriment le respect et la communauté en Yorùbá — le socle de toute conversation.",
  },
  {
    id: "course-5",  languageId: "yoruba", order: 2, level: "intermediate", lessonsCount: 2, courseType: "oral_tradition",
    title: "Ọ̀wẹ̀ Yorùbá — Oral Tradition",
    titleFr: "Ọ̀wẹ̀ Yorùbá — Tradition Orale",
    description: "Explore the proverbs, riddles, and oral wisdom through which Yorùbá people encode history, ethics, and cultural identity.",
    descriptionFr: "Explorez les proverbes, les devinettes et la sagesse orale à travers lesquels le peuple Yorùbá encode l'histoire, l'éthique et l'identité culturelle.",
  },

  // Igbo
  {
    id: "course-6",  languageId: "igbo", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Igbo — First Words",
    titleFr: "Igbo — Premiers Mots",
    description: "Start with the greetings and introductions that mark belonging and respect in Igbo — the emotional entry point into the language.",
    descriptionFr: "Commencez par les salutations et les présentations qui marquent l'appartenance et le respect en Igbo — le point d'entrée affectif dans la langue.",
  },

  // Hausa
  {
    id: "course-7",  languageId: "hausa", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Hausa — First Words",
    titleFr: "Hausa — Premiers Mots",
    description: "Begin with the greetings and social phrases of Hausa — the most widely spoken language in West Africa — and the identity words that open every exchange.",
    descriptionFr: "Commencez par les salutations et les formules sociales du Hausa — la langue la plus parlée en Afrique de l'Ouest — et les mots d'identité qui ouvrent chaque échange.",
  },

  // Swahili
  {
    id: "course-8",  languageId: "swahili", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Kiswahili — First Words",
    titleFr: "Kiswahili — Premiers Mots",
    description: "Start with the greetings and introductions of Kiswahili — the lingua franca of East Africa — and the social phrases that build trust across communities.",
    descriptionFr: "Débutez par les salutations et les présentations du Kiswahili — la lingua franca d'Afrique de l'Est — et les formules sociales qui tissent la confiance entre communautés.",
  },
  {
    id: "course-9",  languageId: "swahili", order: 2, level: "intermediate", lessonsCount: 2, courseType: "oral_tradition",
    title: "Methali — Oral Tradition",
    titleFr: "Methali — Tradition Orale",
    description: "Discover the proverbs and oral wisdom of East African cultures encoded in Kiswahili methali — the living archive of communal knowledge.",
    descriptionFr: "Découvrez les proverbes et la sagesse orale des cultures d'Afrique de l'Est encodés dans les methali kiswahili — l'archive vivante du savoir communautaire.",
  },

  // Amharic
  {
    id: "course-10", languageId: "amharic", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Amharic — First Words",
    titleFr: "Amharic — Premiers Mots",
    description: "Begin with Amharic greetings and self-introductions — the phrases that signal respect and belonging in Ethiopia's official language.",
    descriptionFr: "Débutez par les salutations et les présentations en Amharic — les formules qui expriment le respect et l'appartenance dans la langue officielle de l'Éthiopie.",
  },

  // Akan (Twi)
  {
    id: "course-11", languageId: "akan", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Twi — First Words",
    titleFr: "Twi — Premiers Mots",
    description: "Open with the greetings and introductions of Twi — Ghana's most widely spoken language — and the social phrases that express warmth and community.",
    descriptionFr: "Débutez par les salutations et les présentations du Twi — la langue la plus parlée au Ghana — et les formules sociales qui expriment la chaleur et la communauté.",
  },

  // Wolof
  {
    id: "course-12", languageId: "wolof", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Wolof — First Words",
    titleFr: "Wolof — Premiers Mots",
    description: "Begin with the warm greetings and identity expressions of Wolof — Senegal's dominant language, known for its culture of hospitality and welcome.",
    descriptionFr: "Commencez par les salutations chaleureuses et les expressions identitaires du Wolof — la langue dominante du Sénégal, réputée pour sa culture de l'hospitalité et de l'accueil.",
  },

  // Egyptian Arabic
  {
    id: "course-13", languageId: "arabic-egyptian", order: 1, level: "beginner", lessonsCount: 3, courseType: "first_words",
    title: "Egyptian Arabic — First Words",
    titleFr: "Arabe égyptien — Premiers Mots",
    description: "Start with the greetings and social phrases of Egyptian Arabic — the most widely understood Arabic dialect — and the expressions of identity that open every encounter.",
    descriptionFr: "Commencez par les salutations et les formules sociales de l'arabe égyptien — le dialecte arabe le plus compris — et les expressions d'identité qui ouvrent chaque rencontre.",
  },

  // Somali
  {
    id: "course-14", languageId: "somali", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Soomaali — First Words",
    titleFr: "Soomaali — Premiers Mots",
    description: "Begin with Somali greetings and introductions — the entry phrases of a Cushitic language with one of Africa's richest oral traditions.",
    descriptionFr: "Débutez par les salutations et les présentations en Somali — les formules d'entrée d'une langue couchitique dotée de l'une des traditions orales les plus riches d'Afrique.",
  },

  // Bambara
  {
    id: "course-15", languageId: "bambara", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Bambara — First Words",
    titleFr: "Bambara — Premiers Mots",
    description: "Open with the greetings and social vocabulary of Bambara — the most widely spoken language of Mali — and the Manding expressions of identity and welcome.",
    descriptionFr: "Débutez par les salutations et le vocabulaire social du Bambara — la langue la plus parlée au Mali — et les expressions mandingues d'identité et d'accueil.",
  },

  // Tamazight
  {
    id: "course-16", languageId: "tamazight", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Tamazight — First Words",
    titleFr: "Tamazight — Premiers Mots",
    description: "Begin with the greetings and identity expressions of Tamazight — the ancient Amazigh language of the Atlas mountains and Sahara — the words that carry millennia of belonging.",
    descriptionFr: "Commencez par les salutations et les expressions identitaires du Tamazight — l'ancienne langue amazighe de l'Atlas et du Sahara — les mots qui portent des millénaires d'appartenance.",
  },

  // Kinyarwanda
  {
    id: "course-17", languageId: "kinyarwanda", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Kinyarwanda — First Words",
    titleFr: "Kinyarwanda — Premiers Mots",
    description: "Start with the greetings and self-introductions of Kinyarwanda — Rwanda's national language and one of the most widely spoken Bantu languages in Central Africa.",
    descriptionFr: "Débutez par les salutations et les présentations en Kinyarwanda — la langue nationale du Rwanda et l'une des langues bantoues les plus parlées en Afrique centrale.",
  },

  // Ewe
  {
    id: "course-18", languageId: "ewe", order: 1, level: "beginner", lessonsCount: 2, courseType: "first_words",
    title: "Eʋegbe — First Words",
    titleFr: "Eʋegbe — Premiers Mots",
    description: "Begin with the greetings and identity words of Eʋegbe (Ewe) — a tonal language spoken across Ghana and Togo — and the social expressions that mark belonging.",
    descriptionFr: "Commencez par les salutations et les mots d'identité de l'Eʋegbe (Ewe) — une langue tonale parlée au Ghana et au Togo — et les expressions sociales qui marquent l'appartenance.",
  },
];
