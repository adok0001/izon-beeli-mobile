/**
 * "Bou Mie" — COURSES (Izon reference), the structured-drill companion
 * --------------------------------------------------------------------
 * Three full Course → Lesson → TranscriptSegment courses, one per level, in
 * Beeli's REAL schema (LessonData + a course-registry entry + a StoryArc). They
 * share the world, cast, and arc of the podcast/films: the same Tari homecoming,
 * the same creeks, the same proverbs — but delivered as short, repeatable lessons.
 *
 *   BEGINNER      course-izon-bm-fw · communicative   · 4 lessons (greetings→market)
 *   INTERMEDIATE  course-izon-bm-el · everyday_life   · 4 lessons (river→union)
 *   ADVANCED      course-izon-bm-ot · oral_tradition  · 3 lessons (proverb→libation)
 *
 * Transcript lines are target-language only with en/fr glosses (no interface
 * language is ever a transcript line). Attested lines come from the corpus;
 * recombinations are the ones a native speaker must confirm; unattested heritage
 * (advanced lesson 2–3) is a [[bracketed placeholder]]. Every lesson isActive:false.
 *
 * NOTE: the app's TranscriptSegment has no per-line verify/roman field (see
 * ../README.md "Schema gaps"), so — unlike the podcast/film scripts — these
 * lessons cannot carry inline verify flags. The whole course is therefore held
 * isActive:false pending a native-speaker pass, and romanization/attestation for
 * each line lives in the parallel podcast files that teach the same phrases.
 */

import type { LessonData } from "../../lessons/types";
import type { StoryArc } from "@/types";
import type { SeriesCourse } from "../course-types";

// ─────────────────────────────────────────────────────────────────────────────
// BEGINNER — course-izon-bm-fw — "Bou Mie: Tari's First Words" (communicative)
// ─────────────────────────────────────────────────────────────────────────────
const BEG_LESSONS: LessonData[] = [
  {
    id: "izon-bmc-b1",
    courseId: "course-izon-bm-fw",
    type: "lesson",
    title: { en: "At the Waterside — Greetings", fr: "Au Bord de l'Eau — Salutations" },
    description: { en: "Arrive with Tari and greet by time of day. Say how you are, welcome, and thank you.", fr: "Arrivez avec Tari et saluez selon l'heure. Dites comment vous allez, la bienvenue et merci." },
    audioUrl: null,
    duration: null,
    order: 1,
    isActive: false,
    skills: ["listening", "speaking", "vocabulary"],
    scene: "boumie.waterside",
    sceneTitle: "The Waterside",
    sceneOrder: 1,
    transcript: [
      { id: "izon-bmc-b1-1", startTime: 0, endTime: 3, text: "Baidẹ!", translation: { en: "Good morning!", fr: "Bonjour !" } },
      { id: "izon-bmc-b1-2", startTime: 3, endTime: 6, text: "E baịdẹ!", translation: { en: "Good afternoon!", fr: "Bon après-midi !" } },
      { id: "izon-bmc-b1-3", startTime: 6, endTime: 9, text: "Baịyo!", translation: { en: "Good evening!", fr: "Bonsoir !" } },
      { id: "izon-bmc-b1-4", startTime: 9, endTime: 12, text: "Tụbara?", translation: { en: "How are you?", fr: "Comment vas-tu ?" } },
      { id: "izon-bmc-b1-5", startTime: 12, endTime: 15, text: "Emi, kuro nimi.", translation: { en: "I am fine, I am well.", fr: "Je vais bien." } },
      { id: "izon-bmc-b1-6", startTime: 15, endTime: 18, text: "A bọọ bomaaa! Nụa!", translation: { en: "Welcome! Welcome!", fr: "Bienvenue ! Bienvenue !" } },
      { id: "izon-bmc-b1-7", startTime: 18, endTime: 21, text: "Ụmbana. Doo.", translation: { en: "Thank you.", fr: "Merci." } },
      { id: "izon-bmc-b1-8", startTime: 21, endTime: 24, text: "Bunuda seri. Baịyo!", translation: { en: "Sleep well. Goodbye!", fr: "Dors bien. Au revoir !" } },
    ],
  },
  {
    id: "izon-bmc-b2",
    courseId: "course-izon-bm-fw",
    type: "lesson",
    title: { en: "Who Are You? — Names & Belonging", fr: "Qui es-tu ? — Noms et Appartenance" },
    description: { en: "Give your name, say where you are from, and declare that you are Izon — as Tari does before Grandmother Ebiere.", fr: "Donnez votre nom, dites d'où vous venez et affirmez que vous êtes Izon — comme Tari devant Grand-mère Ebiere." },
    audioUrl: null,
    duration: null,
    order: 2,
    isActive: false,
    skills: ["speaking", "vocabulary"],
    scene: "boumie.waterside",
    sceneTitle: "The Waterside",
    sceneOrder: 1,
    transcript: [
      { id: "izon-bmc-b2-1", startTime: 0, endTime: 3, text: "Teki ina ẹrẹ?", translation: { en: "What is your name?", fr: "Comment t'appelles-tu ?" } },
      { id: "izon-bmc-b2-2", startTime: 3, endTime: 6, text: "Ina ẹrẹmẹ Tari.", translation: { en: "My name is Tari.", fr: "Je m'appelle Tari." } },
      { id: "izon-bmc-b2-3", startTime: 6, endTime: 10, text: "Emịnị tị ibe ye?", translation: { en: "Which place are you from?", fr: "D'où viens-tu ?" } },
      { id: "izon-bmc-b2-4", startTime: 10, endTime: 14, text: "Emịnị Kolokuma ye.", translation: { en: "I am from Kolokuma.", fr: "Je viens de Kolokuma." } },
      { id: "izon-bmc-b2-5", startTime: 14, endTime: 18, text: "Emịnị Yenagoa ama ka emi.", translation: { en: "I am from Yenagoa.", fr: "Je viens de Yenagoa." } },
      { id: "izon-bmc-b2-6", startTime: 18, endTime: 21, text: "Emịnị Ịzọn ye.", translation: { en: "I am Izon.", fr: "Je suis Izon." } },
      { id: "izon-bmc-b2-7", startTime: 21, endTime: 25, text: "Emịnị fun tolumọ bomị.", translation: { en: "I have come to learn.", fr: "Je suis venu apprendre." } },
      { id: "izon-bmc-b2-8", startTime: 25, endTime: 28, text: "Ịzọn didi! Nụa!", translation: { en: "Izon is proud! Welcome!", fr: "L'Izon est fier ! Bienvenue !" } },
    ],
  },
  {
    id: "izon-bmc-b3",
    courseId: "course-izon-bm-fw",
    type: "lesson",
    title: { en: "Inside the House — Family & Food", fr: "Dans la Maison — Famille et Nourriture" },
    description: { en: "Name family and household foods and accept a meal, as Ebiere feeds Tari the first night home.", fr: "Nommez la famille et les aliments et acceptez un repas, comme Ebiere nourrit Tari le premier soir." },
    audioUrl: null,
    duration: null,
    order: 3,
    isActive: false,
    skills: ["listening", "vocabulary", "speaking"],
    scene: "boumie.compound",
    sceneTitle: "The Compound",
    sceneOrder: 2,
    transcript: [
      { id: "izon-bmc-b3-1", startTime: 0, endTime: 3, text: "Mị warị.", translation: { en: "This is the house.", fr: "Voici la maison." } },
      { id: "izon-bmc-b3-2", startTime: 3, endTime: 6, text: "Ị ta kụrọemi?", translation: { en: "Is your father well?", fr: "Ton père va-t-il bien ?" } },
      { id: "izon-bmc-b3-3", startTime: 6, endTime: 9, text: "Awọụbo kụrọemi?", translation: { en: "Are the children well?", fr: "Les enfants vont-ils bien ?" } },
      { id: "izon-bmc-b3-4", startTime: 9, endTime: 12, text: "Bo eye fị.", translation: { en: "Come and eat.", fr: "Viens manger." } },
      { id: "izon-bmc-b3-5", startTime: 12, endTime: 15, text: "Mị buru. Mị endi.", translation: { en: "This is yam. This is fish.", fr: "Ceci est l'igname. Ceci est le poisson." } },
      { id: "izon-bmc-b3-6", startTime: 15, endTime: 18, text: "Endi emi. Beribe faa.", translation: { en: "There is fish. There is no plantain.", fr: "Il y a du poisson. Il n'y a pas de plantain." } },
      { id: "izon-bmc-b3-7", startTime: 18, endTime: 21, text: "Beni pẹrị.", translation: { en: "I would like water.", fr: "Je voudrais de l'eau." } },
      { id: "izon-bmc-b3-8", startTime: 21, endTime: 24, text: "Doo, Ebiere! Fịyaị ebi!", translation: { en: "Thank you, Ebiere! The soup is good!", fr: "Merci, Ebiere ! La soupe est bonne !" } },
    ],
  },
  {
    id: "izon-bmc-b4",
    courseId: "course-izon-bm-fw",
    type: "lesson",
    title: { en: "Market Day — Counting 1–10", fr: "Jour de Marché — Compter de 1 à 10" },
    description: { en: "Count to ten and ask a price at Mama Seibi's stall. The Izon vigesimal numbers and money words.", fr: "Comptez jusqu'à dix et demandez un prix chez Mama Seibi. Les nombres vigésimaux izon et l'argent." },
    audioUrl: null,
    duration: null,
    order: 4,
    isActive: false,
    skills: ["listening", "vocabulary", "grammar"],
    scene: "boumie.market",
    sceneTitle: "The Market",
    sceneOrder: 3,
    transcript: [
      { id: "izon-bmc-b4-1", startTime: 0, endTime: 4, text: "Kẹnị. Mamụ. Taárụ.", translation: { en: "One. Two. Three.", fr: "Un. Deux. Trois." } },
      { id: "izon-bmc-b4-2", startTime: 4, endTime: 8, text: "Nein. Sọọnrọn.", translation: { en: "Four. Five.", fr: "Quatre. Cinq." } },
      { id: "izon-bmc-b4-3", startTime: 8, endTime: 12, text: "Sondie. Sọnọma. Niina.", translation: { en: "Six. Seven. Eight.", fr: "Six. Sept. Huit." } },
      { id: "izon-bmc-b4-4", startTime: 12, endTime: 16, text: "Isé. Oyi!", translation: { en: "Nine. Ten!", fr: "Neuf. Dix !" } },
      { id: "izon-bmc-b4-5", startTime: 16, endTime: 19, text: "Endi emii?", translation: { en: "Is there fish?", fr: "Y a-t-il du poisson ?" } },
      { id: "izon-bmc-b4-6", startTime: 19, endTime: 23, text: "Endi kẹnị — sịlị ma akpa.", translation: { en: "One fish — ₦400 (two bags).", fr: "Un poisson — 400 ₦ (deux sacs)." } },
      { id: "izon-bmc-b4-7", startTime: 23, endTime: 26, text: "Garịn! Garịn kụrọ!", translation: { en: "Costly! Far too dear!", fr: "C'est cher ! Bien trop cher !" } },
      { id: "izon-bmc-b4-8", startTime: 26, endTime: 30, text: "Sịlị akpa mọ ekise mọ. Kọn!", translation: { en: "₦300 (a bag and a half). Take it!", fr: "300 ₦ (un sac et demi). Prends !" } },
    ],
  },
];

const BEG_STORY: StoryArc = {
  id: "story-izon-bm-fw",
  courseId: "course-izon-bm-fw",
  title: "Bou Mie: Tari's First Words",
  description:
    "Tari's first day home, as a beginner course: greet at the waterside, say who you are, be fed in the compound, and survive Mama Seibi's market. The same day the podcast opens — now as bite-size lessons.",
  chapters: [
    { id: "story-izon-bm-fw-1", lessonId: "izon-bmc-b1", title: "At the Waterside", narrativeIntro: "The boat touches the jetty. Grandmother greets Tari only in Izon.", narrativeOutro: "Tari can greet by time of day and answer warmly.", order: 1 },
    { id: "story-izon-bm-fw-2", lessonId: "izon-bmc-b2", title: "Who Are You?", narrativeIntro: "Ebiere asks the ritual question, though she knows the answer.", narrativeOutro: "Tari can give a name, an origin, and claim being Izon.", order: 2 },
    { id: "story-izon-bm-fw-3", lessonId: "izon-bmc-b3", title: "Inside the House", narrativeIntro: "The first meal is set. Food from a host's hand cannot be refused.", narrativeOutro: "Tari can name family and food and thank the house.", order: 3 },
    { id: "story-izon-bm-fw-4", lessonId: "izon-bmc-b4", title: "Market Day", narrativeIntro: "Mama Seibi's stall, and the first price of the season.", narrativeOutro: "Tari can count to ten and refuse the first price.", order: 4 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERMEDIATE — course-izon-bm-el — "Bou Mie: The Working Creek" (everyday_life)
// ─────────────────────────────────────────────────────────────────────────────
const INT_LESSONS: LessonData[] = [
  {
    id: "izon-bmc-i1",
    courseId: "course-izon-bm-el",
    type: "lesson",
    title: { en: "Down to the River — Commands", fr: "Vers la Rivière — Les Ordres" },
    description: { en: "Fish at dawn with Timi and Uncle Ere: give and follow commands, and hear that the catch is thin.", fr: "Pêchez à l'aube avec Timi et Oncle Ere : donnez et suivez des ordres, et apprenez que la prise est maigre." },
    audioUrl: null,
    duration: null,
    order: 1,
    isActive: false,
    skills: ["listening", "speaking", "grammar"],
    scene: "boumie.creek",
    sceneTitle: "The Creek",
    sceneOrder: 1,
    transcript: [
      { id: "izon-bmc-i1-1", startTime: 0, endTime: 3, text: "Yọụ ee. Kala kala.", translation: { en: "Paddle. Softly, softly.", fr: "Pagaie. Doucement, doucement." } },
      { id: "izon-bmc-i1-2", startTime: 3, endTime: 6, text: "Neti kọn bo.", translation: { en: "Bring the net.", fr: "Apporte le filet." } },
      { id: "izon-bmc-i1-3", startTime: 6, endTime: 9, text: "Beri. Fịye faa.", translation: { en: "Quiet. No talking.", fr: "Silence. On ne parle pas." } },
      { id: "izon-bmc-i1-4", startTime: 9, endTime: 12, text: "Neti kọn! Kọn!", translation: { en: "Pull the net! Pull!", fr: "Tire le filet ! Tire !" } },
      { id: "izon-bmc-i1-5", startTime: 12, endTime: 15, text: "Endi mamụ. Kala endi.", translation: { en: "Two fish. Small fish.", fr: "Deux poissons. Petits poissons." } },
      { id: "izon-bmc-i1-6", startTime: 15, endTime: 18, text: "Opu endi faa?", translation: { en: "No big fish?", fr: "Pas de gros poisson ?" } },
      { id: "izon-bmc-i1-7", startTime: 18, endTime: 22, text: "Bou pẹrị pẹrị. Endi pẹrị.", translation: { en: "The creek gives little. Few fish.", fr: "Le ruisseau donne peu. Peu de poissons." } },
      { id: "izon-bmc-i1-8", startTime: 22, endTime: 28, text: "Ọkọ kẹnị bẹ ama toru firigha-amị.", translation: { en: "One canoe cannot cross the river alone.", fr: "Une seule pirogue ne traverse pas la rivière seule." } },
    ],
  },
  {
    id: "izon-bmc-i2",
    courseId: "course-izon-bm-el",
    type: "lesson",
    title: { en: "Colours of the Masquerade", fr: "Les Couleurs de la Mascarade" },
    description: { en: "At the Ekine festival, read the three mother-colours and describe what you see.", fr: "À la fête Ekine, lisez les trois couleurs-mères et décrivez ce que vous voyez." },
    audioUrl: null,
    duration: null,
    order: 2,
    isActive: false,
    skills: ["listening", "vocabulary"],
    scene: "boumie.festival",
    sceneTitle: "The Festival Ground",
    sceneOrder: 2,
    transcript: [
      { id: "izon-bmc-i2-1", startTime: 0, endTime: 3, text: "Bo dii! Ekine bo.", translation: { en: "Come and see! Ekine is coming.", fr: "Viens voir ! Ekine arrive." } },
      { id: "izon-bmc-i2-2", startTime: 3, endTime: 6, text: "Owu seki mụ.", translation: { en: "The water spirit will dance.", fr: "L'esprit de l'eau va danser." } },
      { id: "izon-bmc-i2-3", startTime: 6, endTime: 9, text: "Igbe titi, owu bo.", translation: { en: "When the drum sounds, the spirit comes.", fr: "Quand le tambour bat, l'esprit vient." } },
      { id: "izon-bmc-i2-4", startTime: 9, endTime: 13, text: "Mị kwa-kwa. Mị pena-pena. Mị dirimo.", translation: { en: "This is red. This is white. This is black.", fr: "Ceci est rouge. Ceci est blanc. Ceci est noir." } },
      { id: "izon-bmc-i2-5", startTime: 13, endTime: 16, text: "Anị bite kwa-kwa. Ebi!", translation: { en: "That is red cloth. Beautiful!", fr: "Cela est un pagne rouge. Magnifique !" } },
      { id: "izon-bmc-i2-6", startTime: 16, endTime: 20, text: "Kwa-kwa — opu. Pena-pena — fie.", translation: { en: "Red — power. White — peace.", fr: "Rouge — pouvoir. Blanc — paix." } },
      { id: "izon-bmc-i2-7", startTime: 20, endTime: 24, text: "Dirimo — toru buma, owu.", translation: { en: "Black — the deep water, the spirits.", fr: "Noir — l'eau profonde, les esprits." } },
      { id: "izon-bmc-i2-8", startTime: 24, endTime: 28, text: "Owu ebi! Beri — dii pere.", translation: { en: "A beautiful masquerade! Quietly — just watch.", fr: "Une belle mascarade ! En silence — regarde." } },
    ],
  },
  {
    id: "izon-bmc-i3",
    courseId: "course-izon-bm-el",
    type: "lesson",
    title: { en: "A Visit — Asking After the Family", fr: "Une Visite — Prendre des Nouvelles" },
    description: { en: "Greet an elder in the respect register and ask after each member of the household.", fr: "Saluez un aîné en registre de respect et prenez des nouvelles de chaque membre du foyer." },
    audioUrl: null,
    duration: null,
    order: 3,
    isActive: false,
    skills: ["speaking", "grammar", "vocabulary"],
    scene: "boumie.compound",
    sceneTitle: "The Compound",
    sceneOrder: 3,
    transcript: [
      { id: "izon-bmc-i3-1", startTime: 0, endTime: 4, text: "E baịdẹ, Kịmịowei.", translation: { en: "Good morning, sir.", fr: "Bonjour, monsieur." } },
      { id: "izon-bmc-i3-2", startTime: 4, endTime: 7, text: "Iyaa! Ị kpọ nụa ee!", translation: { en: "Welcome in return!", fr: "Bienvenue à vous !" } },
      { id: "izon-bmc-i3-3", startTime: 7, endTime: 10, text: "Peretimi, okosu.", translation: { en: "Be seated, elder.", fr: "Asseyez-vous, aîné." } },
      { id: "izon-bmc-i3-4", startTime: 10, endTime: 13, text: "Ị yei kụrọemi?", translation: { en: "Is your husband well?", fr: "Ton mari va-t-il bien ?" } },
      { id: "izon-bmc-i3-5", startTime: 13, endTime: 16, text: "Ị ta kụrọemi?", translation: { en: "Is your father well?", fr: "Ton père va-t-il bien ?" } },
      { id: "izon-bmc-i3-6", startTime: 16, endTime: 19, text: "Awọụbo kụrọemi?", translation: { en: "Are the children well?", fr: "Les enfants vont-ils bien ?" } },
      { id: "izon-bmc-i3-7", startTime: 19, endTime: 22, text: "Kụrọ emi. Awọụ kụrọ emi.", translation: { en: "They are well. The children are well.", fr: "Ils vont bien. Les enfants vont bien." } },
      { id: "izon-bmc-i3-8", startTime: 22, endTime: 26, text: "Sesei, bo ee?", translation: { en: "Please, will you come?", fr: "S'il vous plaît, viendrez-vous ?" } },
    ],
  },
  {
    id: "izon-bmc-i4",
    courseId: "course-izon-bm-el",
    type: "lesson",
    title: { en: "At the Union — Whose House?", fr: "À l'Union — Quelle Maison ?" },
    description: { en: "Follow a marriage talk: the language of belonging (whose family?), request, and agreement.", fr: "Suivez une demande en mariage : le langage de l'appartenance, de la demande et de l'accord." },
    audioUrl: null,
    duration: null,
    order: 4,
    isActive: false,
    skills: ["listening", "grammar", "vocabulary"],
    scene: "boumie.compound",
    sceneTitle: "The Compound",
    sceneOrder: 3,
    transcript: [
      { id: "izon-bmc-i4-1", startTime: 0, endTime: 4, text: "Otu mamụ bo. Preye ere mụ.", translation: { en: "Two families come. Preye will marry.", fr: "Deux familles viennent. Preye va se marier." } },
      { id: "izon-bmc-i4-2", startTime: 4, endTime: 8, text: "Warị mọ warị mọ, kẹnị ye mụ.", translation: { en: "House and house will become one.", fr: "Maison et maison deviendront une." } },
      { id: "izon-bmc-i4-3", startTime: 8, endTime: 11, text: "Mị tị otu ere?", translation: { en: "Whose daughter is she?", fr: "De quelle famille est-elle ?" } },
      { id: "izon-bmc-i4-4", startTime: 11, endTime: 14, text: "Mị tị otu owei?", translation: { en: "Whose son is he?", fr: "De quelle famille est-il ?" } },
      { id: "izon-bmc-i4-5", startTime: 14, endTime: 18, text: "Owo enị ere pẹrị — Preye.", translation: { en: "We ask for your daughter — Preye.", fr: "Nous demandons votre fille — Preye." } },
      { id: "izon-bmc-i4-6", startTime: 18, endTime: 24, text: "Ọfọn pere seikẹ egberi tẹi-amị.", translation: { en: "Words alone do not tie a bundle.", fr: "Les paroles seules ne lient pas le fagot." } },
      { id: "izon-bmc-i4-7", startTime: 24, endTime: 27, text: "Owo inyo gba.", translation: { en: "We say yes.", fr: "Nous disons oui." } },
      { id: "izon-bmc-i4-8", startTime: 27, endTime: 30, text: "Ụmbana, okosu-ama. Doo!", translation: { en: "Thank you, elders. Thank you!", fr: "Merci, les aînés. Merci !" } },
    ],
  },
];

const INT_STORY: StoryArc = {
  id: "story-izon-bm-el",
  courseId: "course-izon-bm-el",
  title: "Bou Mie: The Working Creek",
  description:
    "The working and ceremonial life Tari steps into: the dawn river and its thinning catch, the Ekine masquerade, a family visit in the respect register, and Preye's marriage talk. The intermediate season, as lessons.",
  chapters: [
    { id: "story-izon-bm-el-1", lessonId: "izon-bmc-i1", title: "Down to the River", narrativeIntro: "Before dawn, Tari learns the creek — and that the fish are fewer.", narrativeOutro: "Tari can give and follow river commands, and meet the first proverb.", order: 1 },
    { id: "story-izon-bm-el-2", lessonId: "izon-bmc-i2", title: "Colours of the Masquerade", narrativeIntro: "The Ekine drum calls the water spirits ashore.", narrativeOutro: "Tari can name the three mother-colours and describe the dance.", order: 2 },
    { id: "story-izon-bm-el-3", lessonId: "izon-bmc-i3", title: "A Visit", narrativeIntro: "An elder is greeted before anyone else, and in the right register.", narrativeOutro: "Tari can greet formally and ask after a whole household.", order: 3 },
    { id: "story-izon-bm-el-4", lessonId: "izon-bmc-i4", title: "At the Union", narrativeIntro: "Two houses meet to make Preye's marriage.", narrativeOutro: "Tari can follow the language of belonging, request, and assent.", order: 4 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED — course-izon-bm-ot — "Bou Mie: The Keeper's Words" (oral_tradition)
// ─────────────────────────────────────────────────────────────────────────────
const ADV_LESSONS: LessonData[] = [
  {
    id: "izon-bmc-a1",
    courseId: "course-izon-bm-ot",
    type: "lesson",
    title: { en: "Proverbs of the Canoe & River", fr: "Proverbes de la Pirogue et de la Rivière" },
    description: { en: "The proverbs that settle quarrels and teach belonging — the ones Pa Boma and Ebiere deploy across the season.", fr: "Les proverbes qui règlent les querelles et enseignent l'appartenance — ceux que Pa Boma et Ebiere emploient." },
    audioUrl: null,
    duration: null,
    order: 1,
    isActive: false,
    skills: ["listening", "reading", "speaking"],
    scene: "boumie.assembly",
    sceneTitle: "The Assembly",
    sceneOrder: 1,
    transcript: [
      { id: "izon-bmc-a1-1", startTime: 0, endTime: 6, text: "Ọkọ kẹnị bẹ ama toru firigha-amị.", translation: { en: "One canoe cannot cross the river alone.", fr: "Une seule pirogue ne traverse pas la rivière seule." } },
      { id: "izon-bmc-a1-2", startTime: 6, endTime: 13, text: "Ọkọ ma toru yei keme, bo-o seki ama timi.", translation: { en: "The canoe does not move forward if the paddlers argue.", fr: "La pirogue n'avance pas si les pagayeurs se disputent." } },
      { id: "izon-bmc-a1-3", startTime: 13, endTime: 19, text: "Ọfọn pere seikẹ egberi tẹi-amị.", translation: { en: "Words alone do not tie a bundle.", fr: "Les paroles seules ne lient pas le fagot." } },
      { id: "izon-bmc-a1-4", startTime: 19, endTime: 25, text: "Toru angọ kụlụ bogha.", translation: { en: "The river does not forget its source.", fr: "La rivière n'oublie pas sa source." } },
      { id: "izon-bmc-a1-5", startTime: 25, endTime: 31, text: "Ikị bẹ toru sibi-amị, fẹini mi te ama kuro-amị.", translation: { en: "A fish does not leave the water and claim to be well.", fr: "Un poisson ne quitte pas l'eau en prétendant aller bien." } },
      { id: "izon-bmc-a1-6", startTime: 31, endTime: 37, text: "Obiri ma berei se, a ma gbẹin.", translation: { en: "The palm that bends to the wind does not break.", fr: "Le palmier qui plie au vent ne se casse pas." } },
    ],
  },
  {
    id: "izon-bmc-a2",
    courseId: "course-izon-bm-ot",
    type: "lesson",
    title: { en: "The Story of Woyengi — Retelling", fr: "L'Histoire de Woyengi — Restitution" },
    description: { en: "Follow and retell the Izon creation story in the narrative past, as Ebiere gives it to Tari by lamplight. Heritage content — awaiting a keeper's recording.", fr: "Suivez et racontez l'histoire de la création izon au passé narratif. Contenu patrimonial — en attente de l'enregistrement d'un gardien." },
    audioUrl: null,
    duration: null,
    order: 2,
    isActive: false,
    skills: ["listening", "reading", "speaking"],
    scene: "boumie.compound",
    sceneTitle: "The Compound",
    sceneOrder: 2,
    transcript: [
      { id: "izon-bmc-a2-1", startTime: 0, endTime: 5, text: "Agụra gba. Beke ye…", translation: { en: "(Stories are told) at night. Long ago…", fr: "(Les contes se disent) la nuit. Il y a longtemps…" } },
      { id: "izon-bmc-a2-2", startTime: 5, endTime: 11, text: "Beke ye, Woyengi bomị.", translation: { en: "Long ago, Woyengi came.", fr: "Il y a longtemps, Woyengi vint." } },
      { id: "izon-bmc-a2-3", startTime: 11, endTime: 17, text: "Ereibi timi, kịmị teimị.", translation: { en: "She sat on the chair, she made people.", fr: "Elle s'assit sur le trône, fit les gens." } },
      { id: "izon-bmc-a2-4", startTime: 17, endTime: 23, text: "Ebi kọn, fiyowei piri.", translation: { en: "She took clay, she gave life.", fr: "Elle prit l'argile, donna la vie." } },
      { id: "izon-bmc-a2-5", startTime: 23, endTime: 29, text: "Enị ogbo, ị pẹrịmị.", translation: { en: "Your destiny, you yourself chose it.", fr: "Ton destin, c'est toi qui l'as choisi." } },
      { id: "izon-bmc-a2-6", startTime: 29, endTime: 60, text: "[[IZON — full Woyengi narrative, sourced verbatim from a verified keeper: the descent on lightning to Oporoma, the moulding of humankind, the choosing of destiny. Do not fabricate.]]", translation: { en: "(The full creation narrative — to be recorded verbatim from a verified Izon keeper.)", fr: "(Le récit complet de la création — à enregistrer mot pour mot auprès d'un gardien izon vérifié.)" } },
    ],
  },
  {
    id: "izon-bmc-a3",
    courseId: "course-izon-bm-ot",
    type: "lesson",
    title: { en: "Blessing & Libation — Speaking for the Family", fr: "Bénédiction et Libation — Parler pour la Famille" },
    description: { en: "The highest register: the words of thanks, blessing, and belonging spoken at the water. Heritage/ritual content — awaiting an elder's recording.", fr: "Le registre le plus élevé : les paroles de remerciement, de bénédiction et d'appartenance à l'eau. Contenu rituel — en attente d'un aîné." },
    audioUrl: null,
    duration: null,
    order: 3,
    isActive: false,
    skills: ["listening", "reading", "speaking"],
    scene: "boumie.water",
    sceneTitle: "The Water's Edge",
    sceneOrder: 3,
    transcript: [
      { id: "izon-bmc-a3-1", startTime: 0, endTime: 5, text: "Daubọ, doo. Owuamapu, doo.", translation: { en: "Ancestors, thank you. Water spirits, thank you.", fr: "Ancêtres, merci. Esprits de l'eau, merci." } },
      { id: "izon-bmc-a3-2", startTime: 5, endTime: 10, text: "Emịnị bou mie, warị mie.", translation: { en: "I came to the creek, and I have come home.", fr: "Je suis venu au ruisseau, et je suis rentré chez moi." } },
      { id: "izon-bmc-a3-3", startTime: 10, endTime: 14, text: "Amọ fie mie.", translation: { en: "May the town have peace.", fr: "Que la ville ait la paix." } },
      { id: "izon-bmc-a3-4", startTime: 14, endTime: 20, text: "Toru angọ kụlụ bogha.", translation: { en: "The river does not forget its source.", fr: "La rivière n'oublie pas sa source." } },
      { id: "izon-bmc-a3-5", startTime: 20, endTime: 55, text: "[[IZON — the libation formula (vocative call + thanks + blessing), sourced verbatim from a verified Izon elder / Egbesu or Ekine authority, with permission and credit. Do not fabricate.]]", translation: { en: "(The libation — vocative call, thanks, and blessing — to be recorded verbatim from a verified elder/priest, with credit.)", fr: "(La libation — appel, remerciement et bénédiction — à enregistrer mot pour mot auprès d'un aîné/prêtre vérifié, avec crédit.)" } },
      { id: "izon-bmc-a3-6", startTime: 55, endTime: 60, text: "Ịzọn didi! Enị warị mie, tụbọụ.", translation: { en: "Izon is proud! You have come home, child.", fr: "L'Izon est fier ! Tu es rentré chez toi, mon enfant." } },
    ],
  },
];

const ADV_STORY: StoryArc = {
  id: "story-izon-bm-ot",
  courseId: "course-izon-bm-ot",
  title: "Bou Mie: The Keeper's Words",
  description:
    "The heritage crown, as a course: the proverbs that settle disputes, the Woyengi creation story retold, and the blessing at the water where Tari finally speaks for the family. Heritage lessons stay closed until a keeper records them.",
  chapters: [
    { id: "story-izon-bm-ot-1", lessonId: "izon-bmc-a1", title: "Proverbs of the Canoe & River", narrativeIntro: "In the assembly, the sharpest weapon is a proverb.", narrativeOutro: "Tari can recognise and deploy the season's core proverbs.", order: 1 },
    { id: "story-izon-bm-ot-2", lessonId: "izon-bmc-a2", title: "The Story of Woyengi", narrativeIntro: "By lamplight, the Mother, the clay, and the choosing.", narrativeOutro: "Tari can retell the creation story's spine in the narrative past.", order: 2 },
    { id: "story-izon-bm-ot-3", lessonId: "izon-bmc-a3", title: "Blessing & Libation", narrativeIntro: "The whole town at the water; the family is called to speak.", narrativeOutro: "Tari can speak a short, true praise before the community.", order: 3 },
  ],
};

// ─── Assembly ────────────────────────────────────────────────────────────────
export const IZON_BM_COURSES: SeriesCourse[] = [
  { entry: { id: "course-izon-bm-fw", languageId: "izon", order: 101, level: "beginner", courseType: "communicative", title: { en: "Bou Mie: Tari's First Words", fr: "Bou Mie : Les Premiers Mots de Tari" }, description: { en: "The homecoming, as a beginner course: greetings, names, the household, and the market — the world of the podcast's first three episodes.", fr: "Le retour au pays, en cours débutant : salutations, noms, le foyer et le marché." } }, lessons: BEG_LESSONS, story: BEG_STORY },
  { entry: { id: "course-izon-bm-el", languageId: "izon", order: 102, level: "intermediate", courseType: "everyday_life", title: { en: "Bou Mie: The Working Creek", fr: "Bou Mie : Le Ruisseau au Travail" }, description: { en: "The working and ceremonial world: the river, the Ekine masquerade, a formal visit, and a marriage talk.", fr: "Le monde du travail et des cérémonies : la rivière, la mascarade Ekine, une visite formelle et une demande en mariage." } }, lessons: INT_LESSONS, story: INT_STORY },
  { entry: { id: "course-izon-bm-ot", languageId: "izon", order: 103, level: "advanced", courseType: "oral_tradition", title: { en: "Bou Mie: The Keeper's Words", fr: "Bou Mie : Les Paroles du Gardien" }, description: { en: "The heritage crown: proverbs, the Woyengi creation story, and the libation at the water. Heritage lessons await a keeper's recording.", fr: "La couronne patrimoniale : proverbes, l'histoire de Woyengi et la libation à l'eau." } }, lessons: ADV_LESSONS, story: ADV_STORY },
];

/** Flattened views for wiring into the app (see ../README.md). */
export const IZON_BM_COURSE_ENTRIES = IZON_BM_COURSES.map((c) => c.entry);
export const IZON_BM_COURSE_LESSONS: LessonData[] = IZON_BM_COURSES.flatMap((c) => c.lessons);
export const IZON_BM_COURSE_STORIES: StoryArc[] = IZON_BM_COURSES
  .map((c) => c.story)
  .filter((s): s is StoryArc => s !== undefined);
