/**
 * Single source of truth for all courses.
 *
 * Imported by:
 *  - Server seed (via relative path)
 *  - App can also import directly via @/lib/data/courses
 *
 * lessonsCount is derived at module load time from ALL_LESSONS so it never
 * goes stale when lessons are added or removed.
 */

import type { CourseType } from "../../types/index";
import type { LocalizedText } from "../../types/index";
import { ALL_LESSONS } from "./lessons/index";
import { STUB_COURSES } from "./lessons/stub";

export type CourseEntry = {
  id: string;
  languageId: string;
  title: string | LocalizedText;
  description: string | LocalizedText;
  level: string;
  lessonsCount: number;
  order: number;
  courseType: CourseType;
};

type RawCourseEntry = Omit<CourseEntry, "lessonsCount">;

function withDerivedCounts(raw: RawCourseEntry[]): CourseEntry[] {
  const counts = new Map<string, number>();
  for (const l of ALL_LESSONS) {
    counts.set(l.courseId, (counts.get(l.courseId) ?? 0) + 1);
  }
  return raw.map((c) => ({ ...c, lessonsCount: counts.get(c.id) ?? 0 }));
}

const RAW_COURSES: RawCourseEntry[] = [
  // Izon
  {
    id: "course-izon-fw",  languageId: "izon", order: 1, level: "beginner", courseType: "house",
    title: { en: "Warị — The House", fr: "Warị — La Maison" },
    description: { en: "Step inside an Izon home — bedroom, kitchen, parlor, and bathroom — through family life, daily routines, cooking, and household conversation.", fr: "Entrez dans une maison izon — chambre, cuisine, salon et salle de bain — à travers la vie familiale, les routines quotidiennes, la cuisine et les conversations domestiques." },
  },
  {
    id: "course-izon-ss", languageId: "izon", order: 2, level: "beginner", courseType: "sound_script",
    title: { en: "Izọn Fiye — Sounds & Script", fr: "Izọn Fiye — Sons et Écriture" },
    description: { en: "Master the phoneme inventory of Izon — vowel harmony, tonal contrasts, consonant digraphs, and the orthographic conventions used in written Izon.", fr: "Maîtrisez l'inventaire phonémique de l'Izon — harmonie vocalique, contrastes tonaux, digrammes consonantiques et les conventions orthographiques de l'Izon écrit." },
  },
  {
    id: "course-izon-nt", languageId: "izon", order: 3, level: "beginner", courseType: "numbers_trade",
    title: { en: "Kịẹn mọ Okubo — Counting & Trade", fr: "Kịẹn mọ Okubo — Chiffres et Commerce" },
    description: { en: "Learn the traditional Izon vigesimal counting system, market numerals, money vocabulary, and the akpa unit used in trade.", fr: "Apprenez le système de numération vigésimal traditionnel Izon, les chiffres du marché, le vocabulaire de l'argent et l'unité akpa utilisée dans le commerce." },
  },
  {
    id: "course-izon-cm",  languageId: "izon", order: 4, level: "beginner", courseType: "grammar",
    title: { en: "Izọn Ọkọsụọ — Grammar & Structure", fr: "Izọn Ọkọsụọ — Grammaire et Structure" },
    description: { en: "Build the grammatical backbone of Izon — possessives, question words, verb morphology, adjectives, adverbs, ideophones, compounding, and more.", fr: "Construisez le squelette grammatical de l'izon — possessifs, mots interrogatifs, morphologie verbale, adjectifs, adverbes, idéophones, composition et bien plus encore." },
  },
  {
    id: "course-izon-ot",  languageId: "izon", order: 5, level: "intermediate", courseType: "oral_tradition",
    title: { en: "Teme Gba — The Old Stories", fr: "Teme Gba — Les Vieux Contes" },
    description: { en: "Listen to traditional Izon folktales, praise poetry, and proverbs rooted in the rivers, forests, and spiritual memory of the Niger Delta.", fr: "Écoutez les contes traditionnels Izon, la poésie élogieuse et les proverbes enracinés dans les rivières, les forêts et la mémoire spirituelle du delta du Niger." },
  },
  {
    id: "course-izon-cl", languageId: "izon", order: 6, level: "beginner", courseType: "colors",
    title: { en: "Izon Colours — Fịyaị mọ Ẹkẹnị", fr: "Izon Couleurs — Fịyaị mọ Ẹkẹnị" },
    description: { en: "Learn the colour vocabulary of Izon — basic and compound colour terms — through everyday objects and the natural environment.", fr: "Apprenez le vocabulaire des couleurs en Izon — termes de base et composés — à travers des objets du quotidien et l'environnement naturel." },
  },
  {
    id: "course-izon-sg", languageId: "izon", order: 7, level: "beginner", courseType: "songs",
    title: { en: "Ịzọn Tịnmọ — Songs & Sing-Along", fr: "Ịzọn Tịnmọ — Chansons et Karaoké" },
    description: { en: "Learn Izon through traditional and community songs — lullabies, praise songs, and festival music with sing-along lyrics.", fr: "Apprenez l'Izon à travers des chansons traditionnelles et communautaires — berceuses, chants de louange et musique de festival avec paroles à chanter." },
  },
  {
    id: "course-izon-el", languageId: "izon", order: 8, level: "intermediate", courseType: "community",
    title: { en: "Ama mọ Ogbo — Community & Town", fr: "Ama mọ Ogbo — Communauté et Ville" },
    description: { en: "Step into Izon public life — greet neighbours, haggle at the market, eat out, and talk about the weather and the outdoors.", fr: "Entrez dans la vie publique izon — saluez les voisins, négociez au marché, dinez dehors et parlez de la météo et de l'environnement." },
  },
  {
    id: "course-izon-wk", languageId: "izon", order: 9, level: "intermediate", courseType: "work",
    title: { en: "Fịrị mọ Dọụ — Work & Getting Around", fr: "Fịrị mọ Dọụ — Travail et Déplacements" },
    description: { en: "Talk about jobs and occupations, navigate transport and directions, and manage a clinic visit — the language of work and everyday mobility in Izon.", fr: "Parlez des métiers et des professions, gérez les transports et les directions, et organisez une visite au dispensaire — le langage du travail et de la mobilité quotidienne en izon." },
  },
  {
    id: "course-izon-co", languageId: "izon", order: 10, level: "advanced", courseType: "modern_life",
    title: { en: "Izon Ekenemọ — Modern Life", fr: "Izon Ekenemọ — Vie Moderne" },
    description: { en: "Engage with news, technology, dining out, and civic debate in contemporary Izon — advanced register, minimal support.", fr: "Engagez-vous avec l'actualité, la technologie, les restaurants et le débat civique en izon contemporain — registre avancé, soutien minimal." },
  },
  {
    id: "course-izon-dc", languageId: "izon", order: 11, level: "intermediate", courseType: "communicative",
    title: { en: "Izon Dictionary — Core Vocabulary", fr: "Dictionnaire Izon — Vocabulaire de Base" },
    description: { en: "The full Izon core vocabulary, A–Z, drawn from the Kolokuma dictionary and lesson corpus — thousands of words and their meanings.", fr: "Le vocabulaire de base complet de l'izon, de A à Z, tiré du dictionnaire Kolokuma et du corpus de leçons — des milliers de mots et leurs sens." },
  },

  // Yoruba
  {
    id: "course-yoruba-sg", languageId: "yoruba", order: 3, level: "beginner", courseType: "songs",
    title: { en: "Orin Yorùbá — Songs & Sing-Along", fr: "Orin Yorùbá — Chansons et Karaoké" },
    description: { en: "Learn Yorùbá through traditional songs — lullabies, praise songs, and festival music with sing-along lyrics and tonal practice.", fr: "Apprenez le Yorùbá à travers des chansons traditionnelles — berceuses, chants de louange et musique de festival avec paroles à chanter et pratique tonale." },
  },
  {
    id: "course-yoruba-fw",  languageId: "yoruba", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Yoruba — First Words", fr: "Yoruba — Premiers Mots" },
    description: { en: "Open with the greetings and self-introductions that signal respect and community in Yorùbá — the foundation for every conversation.", fr: "Débutez par les salutations et les présentations qui expriment le respect et la communauté en Yorùbá — le socle de toute conversation." },
  },
  {
    id: "course-yoruba-ot",  languageId: "yoruba", order: 2, level: "intermediate", courseType: "oral_tradition",
    title: { en: "Ọ̀wẹ̀ Yorùbá — Oral Tradition", fr: "Ọ̀wẹ̀ Yorùbá — Tradition Orale" },
    description: { en: "Explore the proverbs, riddles, and oral wisdom through which Yorùbá people encode history, ethics, and cultural identity.", fr: "Explorez les proverbes, les devinettes et la sagesse orale à travers lesquels le peuple Yorùbá encode l'histoire, l'éthique et l'identité culturelle." },
  },

  // Igbo
  {
    id: "course-igbo-sg", languageId: "igbo", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Egwu Igbo — Songs & Sing-Along", fr: "Egwu Igbo — Chansons et Karaoké" },
    description: { en: "Learn Igbo through traditional songs — lullabies, masquerade chants, and harvest songs with sing-along lyrics.", fr: "Apprenez l'Igbo à travers des chansons traditionnelles — berceuses, chants de mascarade et chansons de récolte avec paroles à chanter." },
  },
  {
    id: "course-igbo-fw",  languageId: "igbo", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Igbo — First Words", fr: "Igbo — Premiers Mots" },
    description: { en: "Start with the greetings and introductions that mark belonging and respect in Igbo — the emotional entry point into the language.", fr: "Commencez par les salutations et les présentations qui marquent l'appartenance et le respect en Igbo — le point d'entrée affectif dans la langue." },
  },
  {
    id: "course-igbo-ns",  languageId: "igbo", order: 3, level: "beginner", courseType: "script",
    title: { en: "Nsịbịdị — The Script", fr: "Nsịbịdị — L'Écriture" },
    description: { en: "Discover Nsịbịdị — the indigenous Igbo pictographic script used by the Ekpe secret society. Learn to read and recognize symbols across eight thematic domains.", fr: "Découvrez Nsịbịdị — l'écriture pictographique indigène Igbo utilisée par la société secrète Ekpe. Apprenez à lire et à reconnaître les symboles dans huit domaines thématiques." },
  },

  // Hausa
  {
    id: "course-hausa-sg", languageId: "hausa", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Waƙoƙi — Songs & Sing-Along", fr: "Waƙoƙi — Chansons et Karaoké" },
    description: { en: "Learn Hausa through traditional songs — lullabies, praise songs for emirs, and wedding celebration music with sing-along lyrics.", fr: "Apprenez le Hausa à travers des chansons traditionnelles — berceuses, chants de louange pour les émirs et musique de mariage avec paroles à chanter." },
  },
  {
    id: "course-hausa-fw",  languageId: "hausa", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Hausa — First Words", fr: "Hausa — Premiers Mots" },
    description: { en: "Begin with the greetings and social phrases of Hausa — the most widely spoken language in West Africa — and the identity words that open every exchange.", fr: "Commencez par les salutations et les formules sociales du Hausa — la langue la plus parlée en Afrique de l'Ouest — et les mots d'identité qui ouvrent chaque échange." },
  },

  // Swahili
  {
    id: "course-swahili-sg", languageId: "swahili", order: 3, level: "beginner", courseType: "songs",
    title: { en: "Nyimbo — Songs & Sing-Along", fr: "Nyimbo — Chansons et Karaoké" },
    description: { en: "Learn Kiswahili through traditional songs — lullabies, taarab melodies, and bongo flava rhythms with sing-along lyrics.", fr: "Apprenez le Kiswahili à travers des chansons traditionnelles — berceuses, mélodies taarab et rythmes bongo flava avec paroles à chanter." },
  },
  {
    id: "course-swahili-fw",  languageId: "swahili", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Kiswahili — First Words", fr: "Kiswahili — Premiers Mots" },
    description: { en: "Start with the greetings and introductions of Kiswahili — the lingua franca of East Africa — and the social phrases that build trust across communities.", fr: "Débutez par les salutations et les présentations du Kiswahili — la lingua franca d'Afrique de l'Est — et les formules sociales qui tissent la confiance entre communautés." },
  },
  {
    id: "course-swahili-ot",  languageId: "swahili", order: 2, level: "intermediate", courseType: "oral_tradition",
    title: { en: "Methali — Oral Tradition", fr: "Methali — Tradition Orale" },
    description: { en: "Discover the proverbs and oral wisdom of East African cultures encoded in Kiswahili methali — the living archive of communal knowledge.", fr: "Découvrez les proverbes et la sagesse orale des cultures d'Afrique de l'Est encodés dans les methali kiswahili — l'archive vivante du savoir communautaire." },
  },

  // Amharic
  {
    id: "course-amharic-sg", languageId: "amharic", order: 2, level: "beginner", courseType: "songs",
    title: { en: "ዘፈኖች — Songs & Sing-Along", fr: "ዘፈኖች — Chansons et Karaoké" },
    description: { en: "Learn Amharic through traditional songs — lullabies, church hymns, and Eskista dance music with sing-along lyrics in Ge'ez script.", fr: "Apprenez l'Amharic à travers des chansons traditionnelles — berceuses, hymnes liturgiques et musique de danse Eskista avec paroles à chanter en écriture guèze." },
  },
  {
    id: "course-amharic-fw", languageId: "amharic", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Amharic — First Words", fr: "Amharic — Premiers Mots" },
    description: { en: "Begin with Amharic greetings and self-introductions — the phrases that signal respect and belonging in Ethiopia's official language.", fr: "Débutez par les salutations et les présentations en Amharic — les formules qui expriment le respect et l'appartenance dans la langue officielle de l'Éthiopie." },
  },

  // Akan (Twi)
  {
    id: "course-akan-sg", languageId: "akan", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Nnwom — Songs & Sing-Along", fr: "Nnwom — Chansons et Karaoké" },
    description: { en: "Learn Twi through traditional Akan songs — lullabies, highlife classics, and festival music with sing-along lyrics.", fr: "Apprenez le Twi à travers des chansons traditionnelles akan — berceuses, classiques du highlife et musique de festival avec paroles à chanter." },
  },
  {
    id: "course-akan-fw", languageId: "akan", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Twi — First Words", fr: "Twi — Premiers Mots" },
    description: { en: "Open with the greetings and introductions of Twi — Ghana's most widely spoken language — and the social phrases that express warmth and community.", fr: "Débutez par les salutations et les présentations du Twi — la langue la plus parlée au Ghana — et les formules sociales qui expriment la chaleur et la communauté." },
  },

  // Wolof
  {
    id: "course-wolof-sg", languageId: "wolof", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Woy — Songs & Sing-Along", fr: "Woy — Chansons et Karaoké" },
    description: { en: "Learn Wolof through traditional songs — griot praise songs, mbalax rhythms, and Senegalese lullabies with sing-along lyrics.", fr: "Apprenez le Wolof à travers des chansons traditionnelles — chants de griots, rythmes mbalax et berceuses sénégalaises avec paroles à chanter." },
  },
  {
    id: "course-wolof-fw", languageId: "wolof", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Wolof — First Words", fr: "Wolof — Premiers Mots" },
    description: { en: "Begin with the warm greetings and identity expressions of Wolof — Senegal's dominant language, known for its culture of hospitality and welcome.", fr: "Commencez par les salutations chaleureuses et les expressions identitaires du Wolof — la langue dominante du Sénégal, réputée pour sa culture de l'hospitalité et de l'accueil." },
  },

  // Egyptian Arabic
  {
    id: "course-arabic-egyptian-sg", languageId: "arabic-egyptian", order: 2, level: "beginner", courseType: "songs",
    title: { en: "أغاني — Songs & Sing-Along", fr: "أغاني — Chansons et Karaoké" },
    description: { en: "Learn Egyptian Arabic through classic songs — Umm Kulthum-style ballads, shaabi street music, and children's songs with sing-along lyrics.", fr: "Apprenez l'arabe égyptien à travers des chansons classiques — ballades à la Oum Kalthoum, musique chaabi de rue et comptines avec paroles à chanter." },
  },
  {
    id: "course-arabic-egyptian-fw", languageId: "arabic-egyptian", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Egyptian Arabic — First Words", fr: "Arabe égyptien — Premiers Mots" },
    description: { en: "Start with the greetings and social phrases of Egyptian Arabic — the most widely understood Arabic dialect — and the expressions of identity that open every encounter.", fr: "Commencez par les salutations et les formules sociales de l'arabe égyptien — le dialecte arabe le plus compris — et les expressions d'identité qui ouvrent chaque rencontre." },
  },

  // Somali
  {
    id: "course-somali-sg", languageId: "somali", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Heeso — Songs & Sing-Along", fr: "Heeso — Chansons et Karaoké" },
    description: { en: "Learn Somali through traditional songs — pastoral poetry chants, oud-accompanied ballads, and lullabies with sing-along lyrics.", fr: "Apprenez le Somali à travers des chansons traditionnelles — chants de poésie pastorale, ballades accompagnées au oud et berceuses avec paroles à chanter." },
  },
  {
    id: "course-somali-fw", languageId: "somali", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Soomaali — First Words", fr: "Soomaali — Premiers Mots" },
    description: { en: "Begin with Somali greetings and introductions — the entry phrases of a Cushitic language with one of Africa's richest oral traditions.", fr: "Débutez par les salutations et les présentations en Somali — les formules d'entrée d'une langue couchitique dotée de l'une des traditions orales les plus riches d'Afrique." },
  },

  // Bambara
  {
    id: "course-bambara-sg", languageId: "bambara", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Dɔnkili — Songs & Sing-Along", fr: "Dɔnkili — Chansons et Karaoké" },
    description: { en: "Learn Bambara through traditional songs — griot epics, wassoulou rhythms, and Malian lullabies with sing-along lyrics.", fr: "Apprenez le Bambara à travers des chansons traditionnelles — épopées de griots, rythmes wassoulou et berceuses maliennes avec paroles à chanter." },
  },
  {
    id: "course-bambara-fw", languageId: "bambara", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Bambara — First Words", fr: "Bambara — Premiers Mots" },
    description: { en: "Open with the greetings and social vocabulary of Bambara — the most widely spoken language of Mali — and the Manding expressions of identity and welcome.", fr: "Débutez par les salutations et le vocabulaire social du Bambara — la langue la plus parlée au Mali — et les expressions mandingues d'identité et d'accueil." },
  },

  // Tamazight
  {
    id: "course-tamazight-sg", languageId: "tamazight", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Izlan — Songs & Sing-Along", fr: "Izlan — Chansons et Karaoké" },
    description: { en: "Learn Tamazight through traditional songs — Amazigh ahwash chants, wedding songs, and Atlas mountain lullabies with sing-along lyrics.", fr: "Apprenez le Tamazight à travers des chansons traditionnelles — chants ahwash amazighes, chansons de mariage et berceuses de l'Atlas avec paroles à chanter." },
  },
  {
    id: "course-tamazight-fw", languageId: "tamazight", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Tamazight — First Words", fr: "Tamazight — Premiers Mots" },
    description: { en: "Begin with the greetings and identity expressions of Tamazight — the ancient Amazigh language of the Atlas mountains and Sahara — the words that carry millennia of belonging.", fr: "Commencez par les salutations et les expressions identitaires du Tamazight — l'ancienne langue amazighe de l'Atlas et du Sahara — les mots qui portent des millénaires d'appartenance." },
  },

  // Kinyarwanda
  {
    id: "course-kinyarwanda-sg", languageId: "kinyarwanda", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Indirimbo — Songs & Sing-Along", fr: "Indirimbo — Chansons et Karaoké" },
    description: { en: "Learn Kinyarwanda through traditional songs — Intore dance chants, pastoral lullabies, and celebration songs with sing-along lyrics.", fr: "Apprenez le Kinyarwanda à travers des chansons traditionnelles — chants de danse Intore, berceuses pastorales et chansons de fête avec paroles à chanter." },
  },
  {
    id: "course-kinyarwanda-fw", languageId: "kinyarwanda", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Kinyarwanda — First Words", fr: "Kinyarwanda — Premiers Mots" },
    description: { en: "Start with the greetings and self-introductions of Kinyarwanda — Rwanda's national language and one of the most widely spoken Bantu languages in Central Africa.", fr: "Débutez par les salutations et les présentations en Kinyarwanda — la langue nationale du Rwanda et l'une des langues bantoues les plus parlées en Afrique centrale." },
  },

  // Ewe
  {
    id: "course-ewe-sg", languageId: "ewe", order: 2, level: "beginner", courseType: "songs",
    title: { en: "Hadzigbalẽ — Songs & Sing-Along", fr: "Hadzigbalẽ — Chansons et Karaoké" },
    description: { en: "Learn Eʋegbe through traditional songs — agbadza drum songs, lullabies, and festival chants with sing-along lyrics.", fr: "Apprenez l'Eʋegbe à travers des chansons traditionnelles — chansons de tambour agbadza, berceuses et chants de festival avec paroles à chanter." },
  },
  {
    id: "course-ewe-fw", languageId: "ewe", order: 1, level: "beginner", courseType: "first_words",
    title: { en: "Eʋegbe — First Words", fr: "Eʋegbe — Premiers Mots" },
    description: { en: "Begin with the greetings and identity words of Eʋegbe (Ewe) — a tonal language spoken across Ghana and Togo — and the social expressions that mark belonging.", fr: "Commencez par les salutations et les mots d'identité de l'Eʋegbe (Ewe) — une langue tonale parlée au Ghana et au Togo — et les expressions sociales qui marquent l'appartenance." },
  },
];

export const COURSES: CourseEntry[] = withDerivedCounts([
  ...RAW_COURSES,
  // Template stub courses for all unlaunched languages.
  // Educators fill in native-language phrases through the /educator portal.
  ...STUB_COURSES,
]);
