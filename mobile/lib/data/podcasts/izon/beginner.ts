/**
 * "The Long Way Home" — BEGINNER episodes (A1)
 * Three styles, three lengths:
 *   B1  izon-pod-b1  · SKIT           · short  (~7 min)  — Tari arrives; greetings & names
 *   B2  izon-pod-b2  · IMMERSIVE STORY · medium (~13 min) — inside the compound; family & food
 *   B3  izon-pod-b3  · HOST-NARRATED  · long   (~17 min) — market day; numbers & trade
 *
 * VERIFICATION: every episode is isActive:false. Lines taken verbatim from the
 * verified corpus (izon_master_dictionary.csv / the codebase izon lessons) are
 * unflagged; recombined or unattested forms carry verify:true; anything with no
 * attested form is a [[bracketed English placeholder]]. A native Kolokuma
 * speaker must record and confirm before any episode goes live.
 *
 * Corpus sources: userio-docs/izon_master_dictionary.csv,
 * mobile/lib/data/lessons/izon-first-words.ts, izon-numbers-trade.ts,
 * mobile/lib/data/sentences/izon.ts, mobile/lib/data/proverbs/izon.ts.
 */

import type { PodcastEpisode } from "../podcast-types";

const SERIES = "izon-pod-longwayhome";

// ─────────────────────────────────────────────────────────────────────────────
// B1 — SKIT (short) — "Bou Mie — Tari Arrives at the Waterside"
// ─────────────────────────────────────────────────────────────────────────────
const B1: PodcastEpisode = {
  id: "izon-pod-b1",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-fw",
  order: 1,
  level: "beginner",
  style: "skit",
  length: "short",
  targetMinutes: 7,
  title: { en: "Episode 1 — The Waterside", fr: "Épisode 1 — Au Bord de l'Eau" },
  description: {
    en: "Tari steps off the boat at Grandmother Ebiere's village and is greeted only in Izon. Greet by time of day, say your name, and say you have come to learn.",
    fr: "Tari descend du bateau au village de Grand-mère Ebiere et n'est accueilli qu'en Izon. Saluez selon l'heure, dites votre nom et dites que vous êtes venu apprendre.",
  },
  canDo: {
    en: "Greet someone at any time of day, give your name, and say you've come to learn — entirely in Izon.",
    fr: "Saluer selon l'heure du jour, dire votre nom et dire que vous êtes venu apprendre — entièrement en izon.",
  },
  logline: {
    en: "The boat touches the jetty. The old words are waiting.",
    fr: "Le bateau touche l'embarcadère. Les vieux mots attendent.",
  },
  cefr: "A1",
  movementId: "mv_arrival",
  pillars: ["kinship_belonging", "food_hospitality"],
  place: "path",
  skills: ["listening", "speaking", "vocabulary"],
  cast: ["izon-cast-tari", "izon-cast-preye", "izon-cast-ebiere"],
  recycledFrom: [],
  newVocabTarget: 10,
  targetVocab: [
    { izon: "Baidẹ", roman: "BY-deh", gloss: { en: "good morning", fr: "bonjour" }, source: "izon_master_dictionary.csv" },
    { izon: "Doo", roman: "doh", gloss: { en: "good afternoon / a greeting & thanks particle", fr: "bon après-midi / salutation" }, source: "corpus" },
    { izon: "Baịyo", roman: "BY-yo", gloss: { en: "goodbye", fr: "au revoir" }, source: "izon_master_dictionary.csv" },
    { izon: "Tụbara?", roman: "TOO-bah-rah", gloss: { en: "how are you?", fr: "comment vas-tu ?" }, source: "sentences/izon.ts" },
    { izon: "Emi, kuro nimi", roman: "EH-mee KOO-ro NEE-mee", gloss: { en: "I am fine, I am well", fr: "je vais bien" }, source: "izon-first-words.ts" },
    { izon: "Nụa!", roman: "NOO-ah", gloss: { en: "welcome!", fr: "bienvenue !" }, source: "corpus (bundled audio izon_nua)" },
    // roman is intentionally empty: we have no attested form, so we have no
    // pronunciation to give. Filling it would be re-inventing the word.
    { izon: "[[what is your name?]]", roman: "", gloss: { en: "what is your name?", fr: "comment t'appelles-tu ?" }, verify: true },
    { izon: "[[my name is …]]", roman: "", gloss: { en: "my name is …", fr: "je m'appelle …" }, verify: true },
    { izon: "Ụmbana", roman: "oom-BAH-na", gloss: { en: "thank you", fr: "merci" }, source: "izon_master_dictionary.csv" },
    { izon: "Emịnị Ịzọn ye", roman: "eh-MEE-nee EE-zon yeh", gloss: { en: "I am Izon", fr: "je suis Izon" }, source: "izon-first-words.ts" },
  ],
  // The self-introduction grammar point ("X ẹrẹmẹ Y") was removed: the educator
  // review found teki / ina ẹrẹ / ẹrẹmẹ unattested, so the rule it taught was
  // invented. Restore only once a keeper supplies the real naming construction.
  grammarPoints: [],
  culturalNotes: [
    {
      title: { en: "Greeting is not optional", fr: "Saluer n'est pas facultatif" },
      body: {
        en: "In Izon compounds a greeting is unhurried and comes first — before questions, before business. Skipping it, or rushing it, reads as disrespect. An elder is greeted before anyone else present.",
        fr: "Dans les concessions izon, la salutation est posée et vient en premier — avant les questions, avant les affaires. La bâcler est un manque de respect. On salue l'aîné avant tout le monde.",
      },
      tags: ["greetings_etiquette", "kinship"],
      afterSeq: 5, // → "Preye! Baidẹ!"
    },
    {
      title: { en: "Arriving by water", fr: "Arriver par l'eau" },
      body: {
        en: "Isampou and most Izon towns are riverine — you arrive by boat at a wooden jetty, not by road. The creek (bou) is the front door of the community.",
        fr: "Isampou et la plupart des villes izon sont fluviales — on arrive en bateau à un embarcadère en bois, pas par la route. Le ruisseau (bou) est la porte d'entrée de la communauté.",
      },
      tags: ["geography", "land_livelihood"],
      afterSeq: 3, // → "Tari bou mie. Arụ toru fie."
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: outboard engine cutting to idle, water lapping a wooden jetty, distant birds. Hold 15s, fade under." },
    { seq: 2, kind: "screen", text: "Full-bleed illustration: a small boat at a jetty, creek and palms behind. No text." },
    { seq: 3, kind: "narration", speaker: "izon-cast-preye", text: "Tari bou mie. Arụ toru fie.", roman: "TAH-ri boh MEE-eh. AH-roo TOH-roo fee-eh", translation: { en: "Tari comes to the creek. The boat reaches the water's edge.", fr: "Tari arrive au ruisseau. Le bateau touche la berge." }, verify: true, startTime: 15, endTime: 20 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-preye", text: "Tari! A bọọ bomaaa! Nụa!", roman: "TAH-ri! ah BAW boh-MAH! NOO-ah", translation: { en: "Tari! Welcome! Welcome!", fr: "Tari ! Bienvenue ! Bienvenue !" }, source: "izon_master_dictionary.csv", startTime: 20, endTime: 24 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-tari", text: "Preye! Baidẹ!", roman: "PREH-yeh! BY-deh", translation: { en: "Preye! Good morning!", fr: "Preye ! Bonjour !" }, startTime: 24, endTime: 27 },
    { seq: 6, kind: "dialogue", speaker: "izon-cast-preye", text: "Baidẹ o! Tụbara?", roman: "BY-deh oh! TOO-bah-rah", translation: { en: "Good morning! How are you?", fr: "Bonjour ! Comment vas-tu ?" }, startTime: 27, endTime: 30 },
    { seq: 7, kind: "dialogue", speaker: "izon-cast-tari", text: "Emi… emi, kuro nimi. Doo.", roman: "EH-mee… EH-mee, KOO-ro NEE-mee. doh", translation: { en: "I'm… I'm fine, I'm well. Thank you.", fr: "Je… je vais bien. Merci." }, startTime: 30, endTime: 34 },
    { seq: 8, kind: "note", text: "Tari hesitates on purpose — models the nervous beginner. Keep the stumble in the recording." },
    { seq: 9, kind: "pause", text: "2s — learner absorbs the exchange." },
    { seq: 10, kind: "sfx", text: "Footsteps on wooden planks; a screen door; an older voice from inside the compound." },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Bo! Mịyọ a bo. Awọụ, bo dii.", roman: "boh! MEE-yaw ah boh. AH-wow, boh dee", translation: { en: "Come! Come here. Children, come and look.", fr: "Viens ! Viens ici. Les enfants, venez voir." }, source: "izon_master_dictionary.csv", startTime: 34, endTime: 39 },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-tari", text: "[[Grandma…]] Baidẹ, Ebiere.", translation: { en: "Grandma… Good morning, Ebiere.", fr: "Grand-mère… Bonjour, Ebiere." }, verify: true, startTime: 39, endTime: 43 },
    { seq: 13, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Nụa, tụbọụ. [[what is your name?]]", translation: { en: "Welcome, child. (Now —) what is your name?", fr: "Bienvenue, mon enfant. Comment t'appelles-tu ?" }, verify: true, startTime: 43, endTime: 47 },
    { seq: 14, kind: "note", text: "Ebiere knows Tari's name — she is prompting the ritual self-introduction. A gentle test." },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-tari", text: "[[My name is Tari.]]", translation: { en: "My name is Tari.", fr: "Je m'appelle Tari." }, verify: true, startTime: 47, endTime: 50 },
    { seq: 16, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Ọ dẹ! Emịnị Ịzọn ye. Emịnị warị ye.", roman: "aw deh! eh-MEE-nee EE-zon yeh. eh-MEE-nee WAH-ri yeh", translation: { en: "Good! You are Izon. You are of this house.", fr: "Bien ! Tu es Izon. Tu es de cette maison." }, verify: true, startTime: 50, endTime: 55 },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-tari", text: "Emịnị Ịzọn ye… duọ, emịnị fun tolumọ bomị.", roman: "eh-MEE-nee EE-zon yeh… doo-aw, eh-MEE-nee foon toh-loo-maw BOH-mee", translation: { en: "I am Izon… but I have come to learn.", fr: "Je suis Izon… mais je suis venu apprendre." }, verify: true, startTime: 55, endTime: 60 },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Ụmbana. Bo eye fị. Baịyo.", roman: "oom-BAH-na. boh EH-yeh fee. BY-yo", translation: { en: "Thank you. Come and eat. (For now —) goodbye.", fr: "Merci. Viens manger. Au revoir." }, source: "izon_master_dictionary.csv", startTime: 60, endTime: 65 },
    { seq: 19, kind: "pause", text: "3s." },
    // Echo block — learner produces the four keystones.
    { seq: 20, kind: "screen", text: "Script reveal: the four key phrases appear in Izon with their icons." },
    { seq: 21, kind: "dialogue", speaker: "izon-cast-preye", text: "Baidẹ!", roman: "BY-deh", translation: { en: "Good morning!", fr: "Bonjour !" }, startTime: 66, endTime: 68 },
    { seq: 22, kind: "pause", text: "4s — learner echoes 'Baidẹ!'" },
    { seq: 23, kind: "dialogue", speaker: "izon-cast-preye", text: "Tụbara?", roman: "TOO-bah-rah", translation: { en: "How are you?", fr: "Comment vas-tu ?" }, startTime: 72, endTime: 74 },
    { seq: 24, kind: "pause", text: "4s — learner echoes." },
    { seq: 25, kind: "dialogue", speaker: "izon-cast-preye", text: "[[My name is Tari.]]", translation: { en: "My name is Tari.", fr: "Je m'appelle Tari." }, verify: true, startTime: 78, endTime: 81 },
    { seq: 26, kind: "pause", text: "4s — learner substitutes their own name." },
    { seq: 27, kind: "dialogue", speaker: "izon-cast-preye", text: "Ụmbana. Baịyo!", roman: "oom-BAH-na. BY-yo", translation: { en: "Thank you. Goodbye!", fr: "Merci. Au revoir !" }, source: "izon_master_dictionary.csv", startTime: 81, endTime: 84 },
    { seq: 28, kind: "sfx", text: "Ambient jetty returns briefly, fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-tari", direction: "Nervous, slightly out of practice; let the hesitation land." },
      { character: "izon-cast-preye", direction: "Bright, fast, delighted to see the cousin." },
      { character: "izon-cast-ebiere", direction: "Warm authority; unhurried; every word placed." },
    ],
    soundDesign: [
      "Cold open: outboard engine → idle → water on jetty planks.",
      "Interior cue: footsteps on wood, screen door, compound room-tone.",
      "Close: reprise the jetty ambient, fade out.",
    ],
    music: ["None under speech. Optional 2s goje/percussion sting on the title card only."],
    visuals: [
      "SEGMENT open: boat at jetty, no text.",
      "Speaker icons (Tari / Preye / Ebiere portraits) appear as each speaks.",
      "Script reveal: four key phrases in Izon orthography, dotted vowels highlighted.",
    ],
    notes: "Shortest episode of the season — a cold, quick, emotional open. No English anywhere in audio.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "userio-docs/izon_master_dictionary.csv (Baidẹ, Doo, Baịyo, Nụa, Ụmbana, Bo/Mịyọ a bo, A bọọ bomaaa)",
    // izon-first-words.ts / sentences/izon.ts were RETIRED, not sources: the
    // educator review (izon_educator_translation_worksheet.csv) found their
    // naming forms fabricated. The self-introduction lines are [[placeholders]]
    // until a keeper supplies the attested construction.
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// B2 — IMMERSIVE STORY (medium) — "Warị Mie — Inside the House"
// ─────────────────────────────────────────────────────────────────────────────
const B2: PodcastEpisode = {
  id: "izon-pod-b2",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-fw",
  order: 2,
  level: "beginner",
  style: "immersive_story",
  length: "medium",
  targetMinutes: 13,
  title: { en: "Episode 2 — Inside the House", fr: "Épisode 2 — Dans la Maison" },
  description: {
    en: "Ebiere walks Tari through the compound and the kitchen and puts the first meal in front of them. Name family members, name household things and foods, and accept food graciously.",
    fr: "Ebiere fait visiter la concession et la cuisine à Tari et lui sert le premier repas. Nommez les membres de la famille, les objets et les aliments, et acceptez la nourriture avec grâce.",
  },
  canDo: {
    en: "Name family members and household foods, and accept food graciously, in Izon.",
    fr: "Nommer les membres de la famille et les aliments du foyer, et accepter la nourriture avec grâce, en izon.",
  },
  logline: {
    en: "You cannot refuse the food of the house. Learn to name it — and to thank it.",
    fr: "On ne refuse pas la nourriture de la maison. Apprenez à la nommer — et à la remercier.",
  },
  cefr: "A1",
  movementId: "mv_household",
  pillars: ["kinship_belonging", "food_hospitality"],
  place: "hearth_kitchen",
  skills: ["listening", "speaking", "vocabulary"],
  cast: ["izon-cast-tari", "izon-cast-ebiere", "izon-cast-preye"],
  recycledFrom: ["izon-pod-b1"],
  newVocabTarget: 12,
  targetVocab: [
    { izon: "warị", roman: "WAH-ri", gloss: { en: "house", fr: "maison" }, source: "izon_master_dictionary.csv" },
    { izon: "ta", roman: "tah", gloss: { en: "father", fr: "père" }, source: "izon_master_dictionary.csv (Ị ta kụrọemi?)" },
    { izon: "yei", roman: "yay", gloss: { en: "husband", fr: "mari" }, source: "izon_master_dictionary.csv" },
    { izon: "ere", roman: "EH-reh", gloss: { en: "wife", fr: "épouse" }, pos: "n", source: "izon_master_dictionary.csv (èré)" },
    { izon: "tụbọụ", roman: "TOO-bow", gloss: { en: "child", fr: "enfant" }, source: "izon_master_dictionary.csv" },
    { izon: "awọụ", roman: "AH-wow", gloss: { en: "children (suppletive plural)", fr: "enfants" }, source: "izon_master_dictionary.csv" },
    { izon: "eye", roman: "EH-yeh", gloss: { en: "friend", fr: "ami" }, source: "izon_master_dictionary.csv (èyè)" },
    { izon: "buru", roman: "BOO-roo", gloss: { en: "yam", fr: "igname" }, source: "izon_master_dictionary.csv" },
    { izon: "beribe", roman: "beh-REE-beh", gloss: { en: "plantain", fr: "plantain" }, source: "izon_master_dictionary.csv" },
    { izon: "endi", roman: "EN-dee", gloss: { en: "fish", fr: "poisson" }, source: "izon_master_dictionary.csv" },
    { izon: "beni", roman: "BEH-nee", gloss: { en: "water", fr: "eau" }, source: "izon_master_dictionary.csv" },
    { izon: "fịyaị", roman: "FEE-yai", gloss: { en: "soup", fr: "soupe" }, source: "izon_master_dictionary.csv (godogodo example: 'the soup is boiling')", verify: true },
  ],
  grammarPoints: [
    {
      point: { en: "Pointing: Mị X / Anị X", fr: "Montrer : Mị X / Anị X" },
      explanation: {
        en: "'Mị …' = this is …; 'Anị …' = that is …. Add a possessor before the noun: 'Mị enị buru' = this is your yam. This 'Mị/Anị' pattern is the A1 workhorse for naming everything in a room.",
        fr: "'Mị …' = ceci est … ; 'Anị …' = cela est …. Ajoutez un possesseur avant le nom : 'Mị enị buru' = ceci est ton igname.",
      },
      examples: [
        { izon: "Mị warị.", roman: "mee WAH-ri", gloss: { en: "This is a house.", fr: "Ceci est une maison." } },
        { izon: "Mị buru.", roman: "mee BOO-roo", gloss: { en: "This is a yam.", fr: "Ceci est une igname." } },
        { izon: "Anị endi.", roman: "AH-nee EN-dee", gloss: { en: "That is a fish.", fr: "Cela est un poisson." }, verify: true },
      ],
    },
    {
      point: { en: "Asking after people: Ị X kụrọemi?", fr: "Prendre des nouvelles : Ị X kụrọemi ?" },
      explanation: {
        en: "'Ị … kụrọemi?' = 'Is your … well?'. A whole family visit is a chain of these: Ị ta kụrọemi? (your father?), Ị yei kụrọemi? (your husband?), Awọụbo kụrọemi? (the children?).",
        fr: "'Ị … kụrọemi ?' = '… va-t-il bien ?'. Une visite familiale est une série de ces questions.",
      },
      examples: [
        { izon: "Ị ta kụrọemi?", roman: "ee tah koo-RAW-eh-mee", gloss: { en: "Is your father well?", fr: "Ton père va-t-il bien ?" } },
        { izon: "Awọụbo kụrọemi?", roman: "ah-WOW-boh koo-RAW-eh-mee", gloss: { en: "Are the children well?", fr: "Les enfants vont-ils bien ?" } },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "Food offered must be accepted", fr: "La nourriture offerte doit être acceptée" },
      body: {
        en: "To refuse food from a host's hand is to refuse the household itself. Even a taste honors it. The iconic Delta meal is banga (palm-nut soup) with starch (cassava) and fresh river fish (endi).",
        fr: "Refuser la nourriture de la main d'un hôte, c'est refuser le foyer lui-même. Même une bouchée l'honore. Le plat emblématique du Delta est le banga (soupe de noix de palme) avec de l'amidon et du poisson frais.",
      },
      tags: ["cuisine", "food_hospitality"],
      afterSeq: 19, // → "Doo, Ebiere. Fịyaị ebi!"
    },
    {
      title: { en: "Everyone in the compound is 'family'", fr: "Toute la concession est 'la famille'" },
      body: {
        en: "Izon kinship is wide: cousins are 'brothers/sisters', a mother's friend is an 'aunty', the elder woman is grandmother to every child. Address forms carry the respect, so learning them is learning your place in the house.",
        fr: "La parenté izon est large : les cousins sont 'frères/sœurs', l'amie d'une mère est une 'tante', l'aînée est la grand-mère de chaque enfant. Les formes d'adresse portent le respect.",
      },
      tags: ["kinship", "greetings_etiquette"],
      afterSeq: 9, // → "Mị enị awọụ. Anị Preye. Mị enị eye."
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: compound interior — a broom on packed earth, a pot on coals, children outside. Hold 15s, fade under." },
    { seq: 2, kind: "screen", text: "Illustration: a swept compound, a doorway, cooking smoke. No text." },
    { seq: 3, kind: "narration", speaker: "izon-cast-ebiere", text: "Mị owo warị. Bo, dii.", roman: "mee OH-wo WAH-ri. boh, dee", translation: { en: "This is our house. Come, look.", fr: "Voici notre maison. Viens, regarde." }, verify: true, startTime: 15, endTime: 19 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Mị warị. Anị eyitụọyọ.", roman: "mee WAH-ri. AH-nee eh-yee-TOO-aw-yaw", translation: { en: "This is the house. That is the kitchen.", fr: "Ceci est la maison. Cela est la cuisine." }, source: "izon_master_dictionary.csv (eyitụọyọ = kitchen)", verify: true, startTime: 19, endTime: 24 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-tari", text: "Mị warị… ebi warị.", roman: "mee WAH-ri… EH-bee WAH-ri", translation: { en: "This is a house… a good house.", fr: "Ceci est une maison… une belle maison." }, verify: true, startTime: 24, endTime: 28 },
    { seq: 6, kind: "note", text: "Tari tries the Mị-pattern unprompted — small win, let it be warm." },
    { seq: 7, kind: "dialogue", speaker: "izon-cast-preye", text: "Awọụ mọ eye mọ, bo! Tari bomị!", roman: "AH-wow maw EH-yeh maw, boh! TAH-ri BOH-mee", translation: { en: "Children and friends, come! Tari has come!", fr: "Enfants et amis, venez ! Tari est arrivé !" }, verify: true, startTime: 28, endTime: 33 },
    { seq: 8, kind: "sfx", text: "Children run in, laughter." },
    { seq: 9, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Mị enị awọụ. Anị Preye. Mị enị eye.", roman: "mee EH-nee AH-wow. AH-nee PREH-yeh. mee EH-nee EH-yeh", translation: { en: "These are your children (kin). That is Preye. This is your friend.", fr: "Voici tes enfants (ta parenté). Cela est Preye. Voici ton ami." }, verify: true, startTime: 33, endTime: 39 },
    { seq: 10, kind: "pause", text: "2s." },
    // Family well-being chain (recycled greeting register from B1, extended).
    { seq: 11, kind: "dialogue", speaker: "izon-cast-tari", text: "Ị ta kụrọemi? Awọụbo kụrọemi?", roman: "ee tah koo-RAW-eh-mee? ah-WOW-boh koo-RAW-eh-mee", translation: { en: "Is your father well? Are the children well?", fr: "Ton père va-t-il bien ? Les enfants vont-ils bien ?" }, source: "izon_master_dictionary.csv", startTime: 39, endTime: 44 },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-preye", text: "Kụrọ emi! Awọụ kụrọ emi.", roman: "KOO-ro EH-mee! AH-wow KOO-ro EH-mee", translation: { en: "They are well! The children are well.", fr: "Ils vont bien ! Les enfants vont bien." }, verify: true, startTime: 44, endTime: 48 },
    { seq: 13, kind: "sfx", text: "Move to the hearth: pot lid, ladle, soup at a rolling boil (godogodo)." },
    { seq: 14, kind: "screen", text: "Illustration: a bowl of banga soup, starch, a whole fish. No text." },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Bo eye fị. Mị buru. Mị fịyaị. Mị endi.", roman: "boh EH-yeh fee. mee BOO-roo. mee FEE-yai. mee EN-dee", translation: { en: "Come and eat. This is yam. This is soup. This is fish.", fr: "Viens manger. Ceci est l'igname. Ceci est la soupe. Ceci est le poisson." }, source: "izon_master_dictionary.csv", verify: true, startTime: 48, endTime: 54 },
    { seq: 16, kind: "dialogue", speaker: "izon-cast-tari", text: "Beni… emịnị beni pẹrị.", roman: "BEH-nee… eh-MEE-nee BEH-nee PEH-ri", translation: { en: "Water… I would like water.", fr: "De l'eau… je voudrais de l'eau." }, verify: true, startTime: 54, endTime: 58 },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-preye", text: "Beribe emii? Endi emii?", roman: "beh-REE-beh eh-MEE? EN-dee eh-MEE", translation: { en: "Is there plantain? Is there fish?", fr: "Y a-t-il du plantain ? Y a-t-il du poisson ?" }, source: "izon_master_dictionary.csv", startTime: 58, endTime: 62 },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Endi emi. Beribe faa. Buru emi.", roman: "EN-dee EH-mee. beh-REE-beh fah. BOO-roo EH-mee", translation: { en: "There is fish. There is no plantain. There is yam.", fr: "Il y a du poisson. Il n'y a pas de plantain. Il y a de l'igname." }, source: "izon_master_dictionary.csv (…faa = there is none)", startTime: 62, endTime: 67 },
    { seq: 19, kind: "dialogue", speaker: "izon-cast-tari", text: "Doo, Ebiere. Fịyaị ebi!", roman: "doh, eh-bee-EH-reh. FEE-yai EH-bee", translation: { en: "Thank you, Ebiere. The soup is good!", fr: "Merci, Ebiere. La soupe est bonne !" }, verify: true, startTime: 67, endTime: 71 },
    { seq: 20, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Ụmbana. Fị kuro. Enị warị mie.", roman: "oom-BAH-na. fee KOO-ro. EH-nee WAH-ri MEE-eh", translation: { en: "You're welcome. Eat well. You have come home.", fr: "De rien. Mange bien. Tu es rentré à la maison." }, verify: true, startTime: 71, endTime: 76 },
    { seq: 21, kind: "pause", text: "3s." },
    // STORY segment — extended input, in Izon, on the meaning of 'the house'.
    { seq: 22, kind: "screen", text: "Single illustration: the compound at dusk, one lamp lit. No text." },
    { seq: 23, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON NARRATION — 5–6 sentences: 'A house is not the walls. A house is the people in it. When a child returns, the house eats together; that is how we know it is still a house. Eat, and you belong.' — MUST be composed and recorded with a native Kolokuma speaker.]]", translation: { en: "(Ebiere reflects: a house is its people, not its walls; when a child returns the house eats together, and that is how we know it is still a house.)", fr: "(Ebiere médite : une maison, ce sont ses gens, pas ses murs ; quand un enfant revient, la maison mange ensemble.)" }, verify: true, startTime: 76, endTime: 140 },
    { seq: 24, kind: "note", text: "Learner is NOT expected to parse the story fully — extended authentic input only. Catch 'warị', 'awọụ', 'fị', 'bo'." },
    { seq: 25, kind: "sfx", text: "Evening compound ambient returns, crickets, fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-ebiere", direction: "Host of the episode; carries the naming and the closing story. Careful, unhurried." },
      { character: "izon-cast-tari", direction: "Growing in confidence; still simple sentences." },
      { character: "izon-cast-preye", direction: "Energetic connective tissue; brings the room to life." },
    ],
    soundDesign: [
      "Compound interior bed (broom, distant children).",
      "Hearth foley: pot, ladle, boiling soup (godogodo).",
      "Dusk transition for the story: crickets, one lamp.",
    ],
    music: ["None under speech."],
    visuals: [
      "Naming beats: object icons appear one per phrase (house, kitchen, yam, soup, fish, water).",
      "Family beat: portrait chips for Preye, the children, 'friend'.",
      "Story beat: single dusk illustration, no text — pure listening.",
    ],
    notes: "The closing STORY is heritage-adjacent authored narration; left as a bracketed placeholder for a native speaker to compose so it is idiomatic, not calqued.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "userio-docs/izon_master_dictionary.csv (warị, buru, endi, beribe, beni, faa, Ị ta/Awọụbo kụrọemi, Bo eye fị, eyitụọyọ)",
    "mobile/lib/data/cultural/izon.ts (banga/starch meal context)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// B3 — HOST-NARRATED (long) — "Foubai — Market Day"
// (host = Speaker A narrating IN IZON; not a bilingual host)
// ─────────────────────────────────────────────────────────────────────────────
const B3: PodcastEpisode = {
  id: "izon-pod-b3",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-nt",
  order: 3,
  level: "beginner",
  style: "host_narrated",
  length: "long",
  targetMinutes: 17,
  title: { en: "Episode 3 — Market Day", fr: "Épisode 3 — Jour de Marché" },
  description: {
    en: "Mama Seibi narrates a morning at the waterside market while Tari learns to count to ten, ask a price, call it too dear, and bargain. Numbers 1–10, money words, and the art of the deal.",
    fr: "Mama Seibi raconte une matinée au marché du bord de l'eau pendant que Tari apprend à compter jusqu'à dix, demander un prix, le trouver trop cher et marchander. Les nombres 1 à 10, l'argent et l'art de négocier.",
  },
  canDo: {
    en: "Count to ten, ask a price, and bargain at the market, in Izon.",
    fr: "Compter jusqu'à dix, demander un prix et marchander au marché, en izon.",
  },
  logline: {
    en: "Never pay the first price. First — learn to count.",
    fr: "Ne payez jamais le premier prix. D'abord — apprenez à compter.",
  },
  cefr: "A1",
  movementId: "mv_growing_up",
  pillars: ["land_livelihood", "time_seasons_festivals"],
  place: "market",
  skills: ["listening", "speaking", "vocabulary", "grammar"],
  cast: ["izon-cast-seibi", "izon-cast-tari", "izon-cast-timi"],
  recycledFrom: ["izon-pod-b1", "izon-pod-b2"],
  newVocabTarget: 14,
  targetVocab: [
    { izon: "Kẹnị", roman: "KEH-nee", gloss: { en: "one (1)", fr: "un" }, source: "izon-numbers-trade.ts" },
    { izon: "Mamụ", roman: "MAH-moo", gloss: { en: "two (2)", fr: "deux" }, source: "izon-numbers-trade.ts" },
    { izon: "Taárụ", roman: "TAH-roo", gloss: { en: "three (3)", fr: "trois" }, source: "izon-numbers-trade.ts" },
    { izon: "Nein", roman: "nayn", gloss: { en: "four (4)", fr: "quatre" }, source: "izon-numbers-trade.ts" },
    { izon: "Sọọnrọn", roman: "SAWN-rawn", gloss: { en: "five (5)", fr: "cinq" }, source: "izon-numbers-trade.ts" },
    { izon: "Sondie", roman: "SON-dee-eh", gloss: { en: "six (6)", fr: "six" }, source: "izon-numbers-trade.ts" },
    { izon: "Sọnọma", roman: "saw-NAW-ma", gloss: { en: "seven (7)", fr: "sept" }, source: "izon-numbers-trade.ts" },
    { izon: "Niina", roman: "NEE-na", gloss: { en: "eight (8)", fr: "huit" }, source: "izon-numbers-trade.ts" },
    { izon: "Isé", roman: "ee-SEH", gloss: { en: "nine (9)", fr: "neuf" }, source: "izon-numbers-trade.ts" },
    { izon: "Oyi", roman: "OH-yee", gloss: { en: "ten (10)", fr: "dix" }, source: "izon-numbers-trade.ts" },
    { izon: "sịlị / okubo", roman: "SEE-lee / oh-KOO-bo", gloss: { en: "money", fr: "argent" }, source: "izon_master_dictionary.csv" },
    { izon: "akpa", roman: "AHK-pa", gloss: { en: "a 'bag' — the market unit, = ₦200", fr: "un 'sac' — l'unité du marché, = 200 ₦" }, source: "izon_master_dictionary.csv" },
    { izon: "foubai", roman: "FOH-bye", gloss: { en: "market day", fr: "jour de marché" }, source: "izon_master_dictionary.csv" },
    { izon: "garịn", roman: "GAH-rin", gloss: { en: "costly, dear", fr: "coûteux" }, source: "izon_master_dictionary.csv" },
  ],
  grammarPoints: [
    {
      point: { en: "The vigesimal (base-20) system", fr: "Le système vigésimal (base 20)" },
      explanation: {
        en: "Izon counts in twenties. 1–10 are roots. 11–19 = 'oyi (ten) + N + feni (extra)': Oyi kẹnị feni = 11. 20 = Sí. 40 = Ma sí (2×20). 100 = Sọọnran sí (5×20). Money is counted in akpa 'bags' of ₦200: sịlị akpa = ₦200, sịlị ma akpa = ₦400.",
        fr: "L'izon compte par vingtaines. 1–10 sont des racines. 11–19 = 'oyi (dix) + N + feni (en plus)'. 20 = Sí. 40 = Ma sí (2×20). 100 = Sọọnran sí (5×20).",
      },
      examples: [
        { izon: "Oyi kẹnị feni", roman: "OH-yee KEH-nee FEH-nee", gloss: { en: "eleven (10 + 1 extra)", fr: "onze (10 + 1)" } },
        { izon: "Sí", roman: "see", gloss: { en: "twenty", fr: "vingt" } },
        { izon: "sịlị ma akpa", roman: "SEE-lee mah AHK-pa", gloss: { en: "₦400 (two 'bags')", fr: "400 ₦ (deux 'sacs')" } },
      ],
    },
    {
      point: { en: "Asking 'how much': counting the goods", fr: "Demander 'combien' : compter la marchandise" },
      explanation: {
        en: "Price is asked by 'counting' an item: 'Ọgbọ kẹnị bei?' literally cues 'one fish — count it (name its price)'. The number word does double duty for quantity and price.",
        fr: "Le prix se demande en 'comptant' un article : 'Ọgbọ kẹnị bei ?' littéralement 'un poisson — compte-le'.",
      },
      examples: [
        { izon: "Ọgbọ kẹnị bei?", roman: "AWG-baw KEH-nee bay", gloss: { en: "How much is one (fish)?", fr: "Combien coûte un (poisson) ?" }, verify: true },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "The waterside market", fr: "Le marché du bord de l'eau" },
      body: {
        en: "Foubai, market day, sets the community's clock. Traders arrive by canoe; the market is as much news-exchange and courtship as commerce. Bargaining is expected and enjoyed — paying the first price marks you as a stranger.",
        fr: "Foubai, le jour de marché, règle l'horloge de la communauté. Les commerçants arrivent en pirogue ; le marché est autant échange de nouvelles que commerce. Marchander est attendu et apprécié.",
      },
      tags: ["land_livelihood", "time_seasons_festivals", "market"],
      afterSeq: 4, // → "Emịnị Mama Seibi. Mị emi ogbo. Kịẹn — kẹnị!"
    },
    {
      title: { en: "Counting in bags", fr: "Compter en sacs" },
      body: {
        en: "Older Delta market pricing is reckoned in akpa, 'bags', historically a unit of ₦200. A price given in 'bags' is a living trace of the base-20 counting mind, even as naira notes change hands.",
        fr: "L'ancienne tarification du marché du Delta se compte en akpa, 'sacs', historiquement une unité de 200 ₦, trace vivante de l'esprit vigésimal.",
      },
      tags: ["numbers_trade"],
      afterSeq: 14, // → "Endi kẹnị — sịlị ma akpa."
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: dawn market — canoes bumping, voices haggling, a rooster, water. Hold 20s, fade under." },
    { seq: 2, kind: "screen", text: "Full-bleed: a waterside market, canoes of plantain and fish. No text." },
    // Host-narration frame (Speaker A = Mama Seibi), in Izon.
    { seq: 3, kind: "narration", speaker: "izon-cast-seibi", text: "Foubai. Kịmị ama toru duo bomị. Endi emi, buru emi, beribe emi.", roman: "FOH-bye. KEE-mee ah-MAH TOH-roo doo-aw BOH-mee. EN-dee EH-mee, BOO-roo EH-mee, beh-REE-beh EH-mee", translation: { en: "Market day. People come from the town by the river. There is fish, there is yam, there is plantain.", fr: "Jour de marché. Les gens viennent de la ville par la rivière. Il y a du poisson, de l'igname, du plantain." }, verify: true, startTime: 20, endTime: 28 },
    { seq: 4, kind: "narration", speaker: "izon-cast-seibi", text: "Emịnị Mama Seibi. Mị emi ogbo. Kịẹn — kẹnị!", roman: "eh-MEE-nee MAH-ma SAY-bee. mee EH-mee OG-bo. kee-EN — KEH-nee", translation: { en: "I am Mama Seibi. Here is the market. Let us count — one!", fr: "Je suis Mama Seibi. Voici le marché. Comptons — un !" }, verify: true, startTime: 28, endTime: 34 },
    { seq: 5, kind: "screen", text: "Counting cards: 1 fish … 10 fish, one per number." },
    // Counting drill 1–10, Seibi models, learner echoes (paced).
    { seq: 6, kind: "dialogue", speaker: "izon-cast-seibi", text: "Kẹnị. Mamụ. Taárụ. Nein. Sọọnrọn.", roman: "KEH-nee. MAH-moo. TAH-roo. nayn. SAWN-rawn", translation: { en: "One. Two. Three. Four. Five.", fr: "Un. Deux. Trois. Quatre. Cinq." }, source: "izon-numbers-trade.ts", startTime: 34, endTime: 42 },
    { seq: 7, kind: "pause", text: "4s — learner echoes 1–5." },
    { seq: 8, kind: "dialogue", speaker: "izon-cast-seibi", text: "Sondie. Sọnọma. Niina. Isé. Oyi!", roman: "SON-dee-eh. saw-NAW-ma. NEE-na. ee-SEH. OH-yee", translation: { en: "Six. Seven. Eight. Nine. Ten!", fr: "Six. Sept. Huit. Neuf. Dix !" }, source: "izon-numbers-trade.ts", startTime: 42, endTime: 50 },
    { seq: 9, kind: "pause", text: "4s — learner echoes 6–10." },
    { seq: 10, kind: "sfx", text: "Tari and Timi arrive by canoe — paddle, footsteps on the bank." },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-timi", text: "Mama Seibi! Baidẹ! Endi emii?", roman: "MAH-ma SAY-bee! BY-deh! EN-dee eh-MEE", translation: { en: "Mama Seibi! Good morning! Is there fish?", fr: "Mama Seibi ! Bonjour ! Y a-t-il du poisson ?" }, startTime: 50, endTime: 55 },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-seibi", text: "Baidẹ, Timi! Endi emi. Kala endi, opu endi kpo emi.", roman: "BY-deh, TEE-mee! EN-dee EH-mee. KAH-la EN-dee, OH-poo EN-dee kpo EH-mee", translation: { en: "Good morning, Timi! There is fish. Small fish and big fish too.", fr: "Bonjour, Timi ! Il y a du poisson. Petit poisson et gros poisson aussi." }, source: "izon_master_dictionary.csv (kala endi = small fish; opu = big)", verify: true, startTime: 55, endTime: 62 },
    { seq: 13, kind: "dialogue", speaker: "izon-cast-tari", text: "Endi kẹnị… sịlị bei? Ọgbọ kẹnị bei?", roman: "EN-dee KEH-nee… SEE-lee bay? AWG-baw KEH-nee bay", translation: { en: "One fish… how much money? What does one cost?", fr: "Un poisson… combien d'argent ? Combien coûte un ?" }, verify: true, startTime: 62, endTime: 68 },
    { seq: 14, kind: "dialogue", speaker: "izon-cast-seibi", text: "Endi kẹnị — sịlị ma akpa.", roman: "EN-dee KEH-nee — SEE-lee mah AHK-pa", translation: { en: "One fish — ₦400 (two bags).", fr: "Un poisson — 400 ₦ (deux sacs)." }, source: "izon_master_dictionary.csv (sịlị ma akpa = N400)", startTime: 68, endTime: 73 },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-tari", text: "Ma akpa?! Garịn! Garịn kụrọ!", roman: "mah AHK-pa?! GAH-rin! GAH-rin KOO-ro", translation: { en: "Two bags?! Costly! Far too dear!", fr: "Deux sacs ?! C'est cher ! Bien trop cher !" }, source: "izon_master_dictionary.csv (garịn = costly)", verify: true, startTime: 73, endTime: 78 },
    { seq: 16, kind: "dialogue", speaker: "izon-cast-timi", text: "Mama Seibi, eye ye! Sịlị akpa mọ ekise mọ, doo?", roman: "MAH-ma SAY-bee, EH-yeh yeh! SEE-lee AHK-pa maw eh-KEE-seh maw, doh", translation: { en: "Mama Seibi, we are friends! ₦300 (a bag and a half), please?", fr: "Mama Seibi, on est amis ! 300 ₦ (un sac et demi), s'il te plaît ?" }, source: "izon_master_dictionary.csv (sịlị akpa mọ ekise mọ = N300)", verify: true, startTime: 78, endTime: 85 },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-seibi", text: "Iyaa! Timi, ị eye ye. Sịlị akpa mọ ekise mọ. Kọn!", roman: "ee-YAH! TEE-mee, ee EH-yeh yeh. SEE-lee AHK-pa maw eh-KEE-seh maw. kawn", translation: { en: "Alright! Timi, you are a friend. ₦300. Take it!", fr: "D'accord ! Timi, tu es un ami. 300 ₦. Prends !" }, verify: true, startTime: 85, endTime: 91 },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-tari", text: "Ụmbana, Mama Seibi! Doo!", roman: "oom-BAH-na, MAH-ma SAY-bee! doh", translation: { en: "Thank you, Mama Seibi! Thank you!", fr: "Merci, Mama Seibi ! Merci !" }, startTime: 91, endTime: 95 },
    { seq: 19, kind: "pause", text: "3s." },
    // Pattern drill — substitute the number, price rises.
    { seq: 20, kind: "screen", text: "Substitution table: 'Endi ___ ' with 1 → 2 → 3 fish; price counts up." },
    { seq: 21, kind: "dialogue", speaker: "izon-cast-seibi", text: "Endi kẹnị. Endi mamụ. Endi taárụ.", roman: "EN-dee KEH-nee. EN-dee MAH-moo. EN-dee TAH-roo", translation: { en: "One fish. Two fish. Three fish.", fr: "Un poisson. Deux poissons. Trois poissons." }, verify: true, startTime: 95, endTime: 101 },
    { seq: 22, kind: "pause", text: "4s each — learner produces 'Endi nein', 'Endi sọọnrọn'." },
    // STORY — Seibi on the market as a social world (extended Izon input).
    { seq: 23, kind: "screen", text: "Single illustration: the market at full sun, a knot of women laughing. No text." },
    { seq: 24, kind: "narration", speaker: "izon-cast-seibi", text: "[[IZON STORY — 6–8 sentences: 'The market is not only money. Here we hear who was born, who is to marry, whose net came home empty. A woman who buys nothing still comes to foubai — to see, to be seen, to carry the news home. The market is the mouth of the town.' — compose & record with a native speaker.]]", translation: { en: "(Seibi: the market is not only money — it is where news of births, marriages and misfortune passes; even someone buying nothing comes, to see and be seen. The market is the mouth of the town.)", fr: "(Seibi : le marché n'est pas que l'argent — c'est là que passent les nouvelles ; même qui n'achète rien vient. Le marché est la bouche de la ville.)" }, verify: true, startTime: 101, endTime: 180 },
    { seq: 25, kind: "note", text: "Extended input; learners catch foubai, sịlị, endi, eye, the numbers. No comprehension test." },
    { seq: 26, kind: "sfx", text: "Market ambient swells and fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-seibi", direction: "Narrator/host of the episode. Theatrical, loud, generous. Slows and 'suffers' on price." },
      { character: "izon-cast-tari", direction: "Beginner sticker-shock; genuine outrage at the price is funny and memorable." },
      { character: "izon-cast-timi", direction: "Smooth operator; works the friendship angle to close the deal." },
    ],
    soundDesign: [
      "Dawn market bed: canoes, haggling, rooster, water.",
      "Canoe arrival foley for Tari & Timi.",
      "Counting cards ping softly per number (non-verbal).",
    ],
    music: ["None under speech."],
    visuals: [
      "Numbers 1–10 counting cards, one object per number.",
      "Money card: akpa 'bag' = ₦200 shown building up (₦200 → ₦300 → ₦400).",
      "Substitution table for the price drill.",
      "Story beat: single market illustration, no text.",
    ],
    notes: "Longest beginner episode; the 'host' is Mama Seibi narrating in Izon — there is no interface-language narrator anywhere. The base-20 pattern is taught by the screen alignment, not by spoken metalanguage.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/lessons/izon-numbers-trade.ts (numbers 1–10, vigesimal system, 'Ọgbọ kẹnị bei')",
    "userio-docs/izon_master_dictionary.csv (sịlị/okubo, akpa units N200/N300/N400, foubai, garịn, endi, kala endi)",
  ],
};

export const IZON_PODCAST_BEGINNER: PodcastEpisode[] = [B1, B2, B3];
