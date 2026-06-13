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
import { ALL_LESSONS } from "./lessons/index";
import { STUB_COURSES } from "./lessons/stub";

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
    id: "course-izon-fw",  languageId: "izon", order: 1, level: "beginner", courseType: "first_words",
    title: "Emi — First Words",
    titleFr: "Emi — Premiers Mots",
    description: "Begin with greetings, names, and introductions — the words that open doors and build belonging in Izon community.",
    descriptionFr: "Commencez par les salutations, les noms et les présentations — les mots qui ouvrent les portes et créent un sentiment d'appartenance dans la communauté Izon.",
  },
  {
    id: "course-izon-ss", languageId: "izon", order: 2, level: "beginner", courseType: "sound_script",
    title: "Izọn Fiye — Sounds & Script",
    titleFr: "Izọn Fiye — Sons et Écriture",
    description: "Master the phoneme inventory of Izon — vowel harmony, tonal contrasts, consonant digraphs, and the orthographic conventions used in written Izon.",
    descriptionFr: "Maîtrisez l'inventaire phonémique de l'Izon — harmonie vocalique, contrastes tonaux, digrammes consonantiques et les conventions orthographiques de l'Izon écrit.",
  },
  {
    id: "course-izon-nt", languageId: "izon", order: 3, level: "beginner", courseType: "numbers_trade",
    title: "Kịẹn mọ Okubo — Counting & Trade",
    titleFr: "Kịẹn mọ Okubo — Chiffres et Commerce",
    description: "Learn the traditional Izon vigesimal counting system, market numerals, money vocabulary, and the akpa unit used in trade.",
    descriptionFr: "Apprenez le système de numération vigésimal traditionnel Izon, les chiffres du marché, le vocabulaire de l'argent et l'unité akpa utilisée dans le commerce.",
  },
  {
    id: "course-izon-cm",  languageId: "izon", order: 4, level: "beginner", courseType: "communicative",
    title: "Izọn Gba — Speaking Izon Well",
    titleFr: "Izọn Gba — Bien parler l'Izon",
    description: "Practise extended dialogues, social registers, and the politeness formulas that mark respectful speech across age and community contexts.",
    descriptionFr: "Pratiquez des dialogues étendus, les registres sociaux et les formules de politesse qui caractérisent un discours respectueux selon l'âge et le contexte communautaire.",
  },
  {
    id: "course-izon-ot",  languageId: "izon", order: 5, level: "intermediate", courseType: "oral_tradition",
    title: "Teme Gba — The Old Stories",
    titleFr: "Teme Gba — Les Vieux Contes",
    description: "Listen to traditional Izon folktales, praise poetry, and proverbs rooted in the rivers, forests, and spiritual memory of the Niger Delta.",
    descriptionFr: "Écoutez les contes traditionnels Izon, la poésie élogieuse et les proverbes enracinés dans les rivières, les forêts et la mémoire spirituelle du delta du Niger.",
  },
  {
    id: "course-izon-cl", languageId: "izon", order: 6, level: "beginner", courseType: "colors",
    title: "Izon Colours — Fịyaị mọ Ẹkẹnị",
    titleFr: "Izon Couleurs — Fịyaị mọ Ẹkẹnị",
    description: "Learn the colour vocabulary of Izon — basic and compound colour terms — through everyday objects and the natural environment.",
    descriptionFr: "Apprenez le vocabulaire des couleurs en Izon — termes de base et composés — à travers des objets du quotidien et l'environnement naturel.",
  },
  {
    id: "course-izon-sg", languageId: "izon", order: 7, level: "beginner", courseType: "songs",
    title: "Ịzọn Tịnmọ — Songs & Sing-Along",
    titleFr: "Ịzọn Tịnmọ — Chansons et Karaoké",
    description: "Learn Izon through traditional and community songs — lullabies, praise songs, and festival music with sing-along lyrics.",
    descriptionFr: "Apprenez l'Izon à travers des chansons traditionnelles et communautaires — berceuses, chants de louange et musique de festival avec paroles à chanter.",
  },
  {
    id: "course-izon-el", languageId: "izon", order: 8, level: "intermediate", courseType: "everyday_life",
    title: "Akara Izon — Daily Life & Routines",
    titleFr: "Akara Izon — Vie Quotidienne et Routines",
    description: "Navigate health, transport, food, weather, work, and hospitality in extended Izon dialogues — speaking and listening at intermediate level.",
    descriptionFr: "Gérez la santé, les transports, la nourriture, la météo, le travail et l'hospitalité en dialogues Izon étendus — expression et compréhension au niveau intermédiaire.",
  },
  {
    id: "course-izon-co", languageId: "izon", order: 9, level: "advanced", courseType: "contemporary",
    title: "Izon Ekenemọ — Contemporary Izon",
    titleFr: "Izon Ekenemọ — Izon Contemporain",
    description: "Engage with news, technology, civic debate, and structured writing in contemporary Izon — advanced register, minimal support.",
    descriptionFr: "Engagez-vous avec l'actualité, la technologie, le débat civique et l'écriture structurée en Izon contemporain — registre avancé, soutien minimal.",
  },

  // Yoruba
  {
    id: "course-yoruba-sg", languageId: "yoruba", order: 3, level: "beginner", courseType: "songs",
    title: "Orin Yorùbá — Songs & Sing-Along",
    titleFr: "Orin Yorùbá — Chansons et Karaoké",
    description: "Learn Yorùbá through traditional songs — lullabies, praise songs, and festival music with sing-along lyrics and tonal practice.",
    descriptionFr: "Apprenez le Yorùbá à travers des chansons traditionnelles — berceuses, chants de louange et musique de festival avec paroles à chanter et pratique tonale.",
  },
  {
    id: "course-yoruba-fw",  languageId: "yoruba", order: 1, level: "beginner", courseType: "first_words",
    title: "Yoruba — First Words",
    titleFr: "Yoruba — Premiers Mots",
    description: "Open with the greetings and self-introductions that signal respect and community in Yorùbá — the foundation for every conversation.",
    descriptionFr: "Débutez par les salutations et les présentations qui expriment le respect et la communauté en Yorùbá — le socle de toute conversation.",
  },
  {
    id: "course-yoruba-ot",  languageId: "yoruba", order: 2, level: "intermediate", courseType: "oral_tradition",
    title: "Ọ̀wẹ̀ Yorùbá — Oral Tradition",
    titleFr: "Ọ̀wẹ̀ Yorùbá — Tradition Orale",
    description: "Explore the proverbs, riddles, and oral wisdom through which Yorùbá people encode history, ethics, and cultural identity.",
    descriptionFr: "Explorez les proverbes, les devinettes et la sagesse orale à travers lesquels le peuple Yorùbá encode l'histoire, l'éthique et l'identité culturelle.",
  },

  // Igbo
  {
    id: "course-igbo-sg", languageId: "igbo", order: 2, level: "beginner", courseType: "songs",
    title: "Egwu Igbo — Songs & Sing-Along",
    titleFr: "Egwu Igbo — Chansons et Karaoké",
    description: "Learn Igbo through traditional songs — lullabies, masquerade chants, and harvest songs with sing-along lyrics.",
    descriptionFr: "Apprenez l'Igbo à travers des chansons traditionnelles — berceuses, chants de mascarade et chansons de récolte avec paroles à chanter.",
  },
  {
    id: "course-igbo-fw",  languageId: "igbo", order: 1, level: "beginner", courseType: "first_words",
    title: "Igbo — First Words",
    titleFr: "Igbo — Premiers Mots",
    description: "Start with the greetings and introductions that mark belonging and respect in Igbo — the emotional entry point into the language.",
    descriptionFr: "Commencez par les salutations et les présentations qui marquent l'appartenance et le respect en Igbo — le point d'entrée affectif dans la langue.",
  },

  // Hausa
  {
    id: "course-hausa-sg", languageId: "hausa", order: 2, level: "beginner", courseType: "songs",
    title: "Waƙoƙi — Songs & Sing-Along",
    titleFr: "Waƙoƙi — Chansons et Karaoké",
    description: "Learn Hausa through traditional songs — lullabies, praise songs for emirs, and wedding celebration music with sing-along lyrics.",
    descriptionFr: "Apprenez le Hausa à travers des chansons traditionnelles — berceuses, chants de louange pour les émirs et musique de mariage avec paroles à chanter.",
  },
  {
    id: "course-hausa-fw",  languageId: "hausa", order: 1, level: "beginner", courseType: "first_words",
    title: "Hausa — First Words",
    titleFr: "Hausa — Premiers Mots",
    description: "Begin with the greetings and social phrases of Hausa — the most widely spoken language in West Africa — and the identity words that open every exchange.",
    descriptionFr: "Commencez par les salutations et les formules sociales du Hausa — la langue la plus parlée en Afrique de l'Ouest — et les mots d'identité qui ouvrent chaque échange.",
  },

  // Swahili
  {
    id: "course-swahili-sg", languageId: "swahili", order: 3, level: "beginner", courseType: "songs",
    title: "Nyimbo — Songs & Sing-Along",
    titleFr: "Nyimbo — Chansons et Karaoké",
    description: "Learn Kiswahili through traditional songs — lullabies, taarab melodies, and bongo flava rhythms with sing-along lyrics.",
    descriptionFr: "Apprenez le Kiswahili à travers des chansons traditionnelles — berceuses, mélodies taarab et rythmes bongo flava avec paroles à chanter.",
  },
  {
    id: "course-swahili-fw",  languageId: "swahili", order: 1, level: "beginner", courseType: "first_words",
    title: "Kiswahili — First Words",
    titleFr: "Kiswahili — Premiers Mots",
    description: "Start with the greetings and introductions of Kiswahili — the lingua franca of East Africa — and the social phrases that build trust across communities.",
    descriptionFr: "Débutez par les salutations et les présentations du Kiswahili — la lingua franca d'Afrique de l'Est — et les formules sociales qui tissent la confiance entre communautés.",
  },
  {
    id: "course-swahili-ot",  languageId: "swahili", order: 2, level: "intermediate", courseType: "oral_tradition",
    title: "Methali — Oral Tradition",
    titleFr: "Methali — Tradition Orale",
    description: "Discover the proverbs and oral wisdom of East African cultures encoded in Kiswahili methali — the living archive of communal knowledge.",
    descriptionFr: "Découvrez les proverbes et la sagesse orale des cultures d'Afrique de l'Est encodés dans les methali kiswahili — l'archive vivante du savoir communautaire.",
  },

  // Amharic
  {
    id: "course-amharic-sg", languageId: "amharic", order: 2, level: "beginner", courseType: "songs",
    title: "ዘፈኖች — Songs & Sing-Along",
    titleFr: "ዘፈኖች — Chansons et Karaoké",
    description: "Learn Amharic through traditional songs — lullabies, church hymns, and Eskista dance music with sing-along lyrics in Ge'ez script.",
    descriptionFr: "Apprenez l'Amharic à travers des chansons traditionnelles — berceuses, hymnes liturgiques et musique de danse Eskista avec paroles à chanter en écriture guèze.",
  },
  {
    id: "course-amharic-fw", languageId: "amharic", order: 1, level: "beginner", courseType: "first_words",
    title: "Amharic — First Words",
    titleFr: "Amharic — Premiers Mots",
    description: "Begin with Amharic greetings and self-introductions — the phrases that signal respect and belonging in Ethiopia's official language.",
    descriptionFr: "Débutez par les salutations et les présentations en Amharic — les formules qui expriment le respect et l'appartenance dans la langue officielle de l'Éthiopie.",
  },

  // Akan (Twi)
  {
    id: "course-akan-sg", languageId: "akan", order: 2, level: "beginner", courseType: "songs",
    title: "Nnwom — Songs & Sing-Along",
    titleFr: "Nnwom — Chansons et Karaoké",
    description: "Learn Twi through traditional Akan songs — lullabies, highlife classics, and festival music with sing-along lyrics.",
    descriptionFr: "Apprenez le Twi à travers des chansons traditionnelles akan — berceuses, classiques du highlife et musique de festival avec paroles à chanter.",
  },
  {
    id: "course-akan-fw", languageId: "akan", order: 1, level: "beginner", courseType: "first_words",
    title: "Twi — First Words",
    titleFr: "Twi — Premiers Mots",
    description: "Open with the greetings and introductions of Twi — Ghana's most widely spoken language — and the social phrases that express warmth and community.",
    descriptionFr: "Débutez par les salutations et les présentations du Twi — la langue la plus parlée au Ghana — et les formules sociales qui expriment la chaleur et la communauté.",
  },

  // Wolof
  {
    id: "course-wolof-sg", languageId: "wolof", order: 2, level: "beginner", courseType: "songs",
    title: "Woy — Songs & Sing-Along",
    titleFr: "Woy — Chansons et Karaoké",
    description: "Learn Wolof through traditional songs — griot praise songs, mbalax rhythms, and Senegalese lullabies with sing-along lyrics.",
    descriptionFr: "Apprenez le Wolof à travers des chansons traditionnelles — chants de griots, rythmes mbalax et berceuses sénégalaises avec paroles à chanter.",
  },
  {
    id: "course-wolof-fw", languageId: "wolof", order: 1, level: "beginner", courseType: "first_words",
    title: "Wolof — First Words",
    titleFr: "Wolof — Premiers Mots",
    description: "Begin with the warm greetings and identity expressions of Wolof — Senegal's dominant language, known for its culture of hospitality and welcome.",
    descriptionFr: "Commencez par les salutations chaleureuses et les expressions identitaires du Wolof — la langue dominante du Sénégal, réputée pour sa culture de l'hospitalité et de l'accueil.",
  },

  // Egyptian Arabic
  {
    id: "course-arabic-egyptian-sg", languageId: "arabic-egyptian", order: 2, level: "beginner", courseType: "songs",
    title: "أغاني — Songs & Sing-Along",
    titleFr: "أغاني — Chansons et Karaoké",
    description: "Learn Egyptian Arabic through classic songs — Umm Kulthum-style ballads, shaabi street music, and children's songs with sing-along lyrics.",
    descriptionFr: "Apprenez l'arabe égyptien à travers des chansons classiques — ballades à la Oum Kalthoum, musique chaabi de rue et comptines avec paroles à chanter.",
  },
  {
    id: "course-arabic-egyptian-fw", languageId: "arabic-egyptian", order: 1, level: "beginner", courseType: "first_words",
    title: "Egyptian Arabic — First Words",
    titleFr: "Arabe égyptien — Premiers Mots",
    description: "Start with the greetings and social phrases of Egyptian Arabic — the most widely understood Arabic dialect — and the expressions of identity that open every encounter.",
    descriptionFr: "Commencez par les salutations et les formules sociales de l'arabe égyptien — le dialecte arabe le plus compris — et les expressions d'identité qui ouvrent chaque rencontre.",
  },

  // Somali
  {
    id: "course-somali-sg", languageId: "somali", order: 2, level: "beginner", courseType: "songs",
    title: "Heeso — Songs & Sing-Along",
    titleFr: "Heeso — Chansons et Karaoké",
    description: "Learn Somali through traditional songs — pastoral poetry chants, oud-accompanied ballads, and lullabies with sing-along lyrics.",
    descriptionFr: "Apprenez le Somali à travers des chansons traditionnelles — chants de poésie pastorale, ballades accompagnées au oud et berceuses avec paroles à chanter.",
  },
  {
    id: "course-somali-fw", languageId: "somali", order: 1, level: "beginner", courseType: "first_words",
    title: "Soomaali — First Words",
    titleFr: "Soomaali — Premiers Mots",
    description: "Begin with Somali greetings and introductions — the entry phrases of a Cushitic language with one of Africa's richest oral traditions.",
    descriptionFr: "Débutez par les salutations et les présentations en Somali — les formules d'entrée d'une langue couchitique dotée de l'une des traditions orales les plus riches d'Afrique.",
  },

  // Bambara
  {
    id: "course-bambara-sg", languageId: "bambara", order: 2, level: "beginner", courseType: "songs",
    title: "Dɔnkili — Songs & Sing-Along",
    titleFr: "Dɔnkili — Chansons et Karaoké",
    description: "Learn Bambara through traditional songs — griot epics, wassoulou rhythms, and Malian lullabies with sing-along lyrics.",
    descriptionFr: "Apprenez le Bambara à travers des chansons traditionnelles — épopées de griots, rythmes wassoulou et berceuses maliennes avec paroles à chanter.",
  },
  {
    id: "course-bambara-fw", languageId: "bambara", order: 1, level: "beginner", courseType: "first_words",
    title: "Bambara — First Words",
    titleFr: "Bambara — Premiers Mots",
    description: "Open with the greetings and social vocabulary of Bambara — the most widely spoken language of Mali — and the Manding expressions of identity and welcome.",
    descriptionFr: "Débutez par les salutations et le vocabulaire social du Bambara — la langue la plus parlée au Mali — et les expressions mandingues d'identité et d'accueil.",
  },

  // Tamazight
  {
    id: "course-tamazight-sg", languageId: "tamazight", order: 2, level: "beginner", courseType: "songs",
    title: "Izlan — Songs & Sing-Along",
    titleFr: "Izlan — Chansons et Karaoké",
    description: "Learn Tamazight through traditional songs — Amazigh ahwash chants, wedding songs, and Atlas mountain lullabies with sing-along lyrics.",
    descriptionFr: "Apprenez le Tamazight à travers des chansons traditionnelles — chants ahwash amazighes, chansons de mariage et berceuses de l'Atlas avec paroles à chanter.",
  },
  {
    id: "course-tamazight-fw", languageId: "tamazight", order: 1, level: "beginner", courseType: "first_words",
    title: "Tamazight — First Words",
    titleFr: "Tamazight — Premiers Mots",
    description: "Begin with the greetings and identity expressions of Tamazight — the ancient Amazigh language of the Atlas mountains and Sahara — the words that carry millennia of belonging.",
    descriptionFr: "Commencez par les salutations et les expressions identitaires du Tamazight — l'ancienne langue amazighe de l'Atlas et du Sahara — les mots qui portent des millénaires d'appartenance.",
  },

  // Kinyarwanda
  {
    id: "course-kinyarwanda-sg", languageId: "kinyarwanda", order: 2, level: "beginner", courseType: "songs",
    title: "Indirimbo — Songs & Sing-Along",
    titleFr: "Indirimbo — Chansons et Karaoké",
    description: "Learn Kinyarwanda through traditional songs — Intore dance chants, pastoral lullabies, and celebration songs with sing-along lyrics.",
    descriptionFr: "Apprenez le Kinyarwanda à travers des chansons traditionnelles — chants de danse Intore, berceuses pastorales et chansons de fête avec paroles à chanter.",
  },
  {
    id: "course-kinyarwanda-fw", languageId: "kinyarwanda", order: 1, level: "beginner", courseType: "first_words",
    title: "Kinyarwanda — First Words",
    titleFr: "Kinyarwanda — Premiers Mots",
    description: "Start with the greetings and self-introductions of Kinyarwanda — Rwanda's national language and one of the most widely spoken Bantu languages in Central Africa.",
    descriptionFr: "Débutez par les salutations et les présentations en Kinyarwanda — la langue nationale du Rwanda et l'une des langues bantoues les plus parlées en Afrique centrale.",
  },

  // Ewe
  {
    id: "course-ewe-sg", languageId: "ewe", order: 2, level: "beginner", courseType: "songs",
    title: "Hadzigbalẽ — Songs & Sing-Along",
    titleFr: "Hadzigbalẽ — Chansons et Karaoké",
    description: "Learn Eʋegbe through traditional songs — agbadza drum songs, lullabies, and festival chants with sing-along lyrics.",
    descriptionFr: "Apprenez l'Eʋegbe à travers des chansons traditionnelles — chansons de tambour agbadza, berceuses et chants de festival avec paroles à chanter.",
  },
  {
    id: "course-ewe-fw", languageId: "ewe", order: 1, level: "beginner", courseType: "first_words",
    title: "Eʋegbe — First Words",
    titleFr: "Eʋegbe — Premiers Mots",
    description: "Begin with the greetings and identity words of Eʋegbe (Ewe) — a tonal language spoken across Ghana and Togo — and the social expressions that mark belonging.",
    descriptionFr: "Commencez par les salutations et les mots d'identité de l'Eʋegbe (Ewe) — une langue tonale parlée au Ghana et au Togo — et les expressions sociales qui marquent l'appartenance.",
  },
];

export const COURSES: CourseEntry[] = withDerivedCounts([
  ...RAW_COURSES,
  // Template stub courses for all unlaunched languages.
  // Educators fill in native-language phrases through the /educator portal.
  ...STUB_COURSES,
]);
