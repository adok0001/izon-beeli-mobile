/**
 * "The Long Way Home" — ADVANCED episodes (B1–C2), the "heritage crown"
 *   A1  izon-pod-a1  · SKIT           · short  (~9 min)  — a dispute settled by proverb
 *   A2  izon-pod-a2  · IMMERSIVE STORY · medium (~15 min) — Ebiere tells the Woyengi creation story
 *   A3  izon-pod-a3  · HOST-NARRATED  · long   (~19 min) — the festival: libation & Tari speaks for the family
 *
 * This is where real Izon mastery lives — proverb, oratory, story, libation —
 * and where fabrication does the most damage. Proverbs are drawn from the
 * codebase proverb set (still flagged for elder confirmation); the creation
 * account and the libation formula are [[placeholders]] that MUST be sourced
 * from a verified Izon elder / Egbesu or Ekine authority. All isActive:false.
 */

import type { PodcastEpisode } from "../podcast-types";

const SERIES = "izon-pod-longwayhome";

// ─────────────────────────────────────────────────────────────────────────────
// A1 — SKIT (short) — "Ọfọn Kẹmẹ — When Words Bite"
// ─────────────────────────────────────────────────────────────────────────────
const A1: PodcastEpisode = {
  id: "izon-pod-a1",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-ot",
  order: 7,
  level: "advanced",
  style: "skit",
  length: "short",
  targetMinutes: 9,
  title: { en: "Episode 7 — When Words Bite", fr: "Épisode 7 — Quand les Mots Mordent" },
  description: {
    en: "Two neighbours bring a quarrel over a canoe to Pa Boma's assembly. No one shouts; the elder settles it with a single proverb. Follow an argument, hear a proverb do real work, and learn the language of judgement.",
    fr: "Deux voisins portent une querelle de pirogue devant l'assemblée de Pa Boma. Personne ne crie ; l'aîné tranche d'un seul proverbe. Suivez un différend et voyez un proverbe à l'œuvre.",
  },
  canDo: {
    en: "Follow an argument and recognise a proverb settling a dispute, in Izon.",
    fr: "Suivre un différend et reconnaître un proverbe qui règle une dispute, en izon.",
  },
  logline: {
    en: "In the assembly, the sharpest weapon is a proverb — and the elder never misses.",
    fr: "À l'assemblée, l'arme la plus tranchante est un proverbe — et l'aîné ne rate jamais.",
  },
  cefr: "B2",
  movementId: "mv_assembly",
  pillars: ["governance_values", "arts_oratory"],
  place: "assembly",
  skills: ["listening", "speaking", "grammar"],
  cast: ["izon-cast-amaokowei", "izon-cast-timi", "izon-cast-tari"],
  recycledFrom: ["izon-pod-i1"],
  newVocabTarget: 10,
  targetVocab: [
    { izon: "amaokowei", roman: "ah-mah-OH-koh-way", gloss: { en: "the town's ranking elder / chief", fr: "l'aîné dirigeant / chef" }, source: "design-course izon.pack.ts (ama = town)" },
    { izon: "ọfọn", roman: "AW-fawn", gloss: { en: "word / speech", fr: "parole" }, source: "mobile/lib/data/proverbs/izon.ts (pv-iz-4)" },
    { izon: "egberi", roman: "eh-GBEH-ri", gloss: { en: "matter / bundle / story", fr: "affaire / fagot / récit" }, source: "proverbs/izon.ts" },
    { izon: "arụ", roman: "AH-roo", gloss: { en: "canoe", fr: "pirogue" }, source: "izon_master_dictionary.csv" },
    { izon: "tẹi", roman: "TAY", gloss: { en: "to tie / bind", fr: "lier" }, source: "proverbs/izon.ts (egberi tẹi)" },
    { izon: "gbẹin", roman: "GBAIN", gloss: { en: "broken / spoilt", fr: "cassé" }, source: "proverbs/izon.ts (pv-iz-9)" },
    { izon: "kẹmẹ", roman: "KEH-meh", gloss: { en: "to argue / dispute", fr: "se disputer" }, source: "proverbs/izon.ts (pv-iz-18 'yei keme')", verify: true },
    { izon: "seri", roman: "SEH-ri", gloss: { en: "to be well / at peace", fr: "être en paix" }, source: "izon_master_dictionary.csv (seridẹ)" },
    { izon: "inyo / aghaịn", roman: "EEN-yo / ah-GHINE", gloss: { en: "yes / no", fr: "oui / non" }, source: "izon_master_dictionary.csv" },
    { izon: "nimi", roman: "NEE-mee", gloss: { en: "to know / understand", fr: "savoir / comprendre" }, source: "izon_master_dictionary.csv" },
  ],
  grammarPoints: [
    {
      point: { en: "The proverb as a sentence type", fr: "Le proverbe comme type de phrase" },
      explanation: {
        en: "Proverbs use a compressed, timeless grammar: subject + bẹ (topic) + object + verb + negative -amị. 'Ọkọ kẹnị bẹ ama toru firigha-amị' = 'one canoe (topic) does-not cross the river'. The -amị/-gha negative and the general present make a statement that is always true — that is the proverb's authority.",
        fr: "Les proverbes emploient une grammaire comprimée et intemporelle : sujet + bẹ (thème) + objet + verbe + négatif -amị, produisant une vérité toujours valable.",
      },
      examples: [
        { izon: "Ọkọ gbẹin pere bẹ toru ama fiyọ-amị.", roman: "AW-kaw GBAIN PEH-reh beh TOH-roo ah-MAH fee-YAW-ah-mee", gloss: { en: "Even a broken canoe still floats a while.", fr: "Même une pirogue cassée flotte encore un temps." }, source: "proverbs/izon.ts (pv-iz-9)" },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "The assembly settles, it does not punish", fr: "L'assemblée règle, elle ne punit pas" },
      body: {
        en: "Disputes go to the amaokowei and the council, not to raised voices. The goal is restored peace (seri) between neighbours who must share the same creek tomorrow — not a winner. A well-placed proverb ends a quarrel because it moves the matter from persons to shared wisdom no one can argue with.",
        fr: "Les différends vont à l'amaokowei et au conseil, non aux cris. Le but est la paix rétablie (seri) entre voisins qui partageront le même ruisseau demain — non un vainqueur.",
      },
      tags: ["governance_values", "greetings_etiquette"],
    },
    {
      title: { en: "A proverb is an argument you cannot refuse", fr: "Un proverbe est un argument irréfutable" },
      body: {
        en: "To deploy the right proverb at the right moment is the mark of a fully-grown speaker. It is impersonal — 'the ancestors say' — so obeying it costs no face. This is the summit of the language, and the whole season has been climbing toward it.",
        fr: "Placer le bon proverbe au bon moment est la marque d'un locuteur accompli. Il est impersonnel — 'les ancêtres disent' — et s'y plier ne fait perdre la face à personne.",
      },
      tags: ["arts_oratory"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: the assembly shelter — benches, a gavel-tap on wood, murmured onlookers, heat, cicadas. Hold 18s." },
    { seq: 2, kind: "screen", text: "Illustration: a thatched assembly hall, an elder on a carved stool, two men standing. No text." },
    { seq: 3, kind: "narration", speaker: "izon-cast-tari", text: "Amaokowei warị. Otu kẹmẹ — arụ egberi.", roman: "ah-mah-OH-koh-way WAH-ri. OH-too KEH-meh — AH-roo eh-GBEH-ri", translation: { en: "The elder's hall. People are disputing — a matter of a canoe.", fr: "La salle de l'aîné. On se dispute — une affaire de pirogue." }, verify: true, startTime: 18, endTime: 24 },
    { seq: 4, kind: "note", text: "By Episode 7 Tari can NARRATE, not just echo — a deliberate arc marker. This is the learner, grown." },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Beri. Kẹnị kẹnị gba. Timi, ọfọn gba.", roman: "BEH-ri. KEH-nee KEH-nee gbah. TEE-mee, AW-fawn gbah", translation: { en: "Quiet. One at a time. Timi, speak.", fr: "Silence. Un par un. Timi, parle." }, verify: true, startTime: 24, endTime: 30 },
    { seq: 6, kind: "dialogue", speaker: "izon-cast-timi", text: "Amaokowei, emịnị arụ. Anị owei emịnị arụ kọn, arụ gbẹin!", roman: "ah-mah-OH-koh-way, eh-MEE-nee AH-roo. AH-nee OH-way eh-MEE-nee AH-roo kawn, AH-roo GBAIN", translation: { en: "Elder, the canoe is mine. That man took my canoe — and broke it!", fr: "Aîné, la pirogue est à moi. Cet homme a pris ma pirogue — et l'a cassée !" }, verify: true, startTime: 30, endTime: 38 },
    { seq: 7, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Inyo. Anị owei, ọfọn gba. Ị arụ gbẹin ye?", roman: "EEN-yo. AH-nee OH-way, AW-fawn gbah. ee AH-roo GBAIN yeh", translation: { en: "Yes. That man, speak. Did you break the canoe?", fr: "Oui. Cet homme, parle. As-tu cassé la pirogue ?" }, verify: true, startTime: 38, endTime: 45 },
    { seq: 8, kind: "dialogue", speaker: "izon-cast-tari", text: "(kala) Timi kẹmẹ kụrọ. Duọ… arụ gbẹin, kịmị mamụ bẹ toru yẹi keme.", roman: "(KAH-la) TEE-mee KEH-meh KOO-ro. doo-aw… AH-roo GBAIN, KEE-mee MAH-moo beh TOH-roo yay KEH-meh", translation: { en: "(quietly) Timi argues well. But… a broken canoe, and two men quarrelling.", fr: "(doucement) Timi argumente bien. Mais… une pirogue cassée, et deux hommes qui se disputent." }, verify: true, startTime: 45, endTime: 53 },
    { seq: 9, kind: "sfx", text: "The two men talk over each other; the elder raises one hand; instant silence." },
    { seq: 10, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Beri! … Ọkọ ma toru yei keme, bo-o seki ama timi.", roman: "BEH-ri! … AW-kaw mah TOH-roo yay KEH-meh, BOH-oh SEH-kee ah-MAH TEE-mee", translation: { en: "Quiet! … The canoe does not move forward if the paddlers argue.", fr: "Silence ! … La pirogue n'avance pas si les pagayeurs se disputent." }, literal: "canoe if river paddle argue, forward move NEG town be", source: "mobile/lib/data/proverbs/izon.ts (pv-iz-18)", startTime: 53, endTime: 62 },
    { seq: 11, kind: "note", text: "The proverb lands. It reframes the quarrel: you two SHARE the creek; a feud sinks you both. No verdict of guilt — a call to peace." },
    { seq: 12, kind: "pause", text: "3s — let it settle, as the hall does." },
    { seq: 13, kind: "dialogue", speaker: "izon-cast-timi", text: "…Amaokowei nimi. Owo seri. Emịnị arụ tẹi, owo mamụ.", roman: "…ah-mah-OH-koh-way NEE-mee. OH-wo SEH-ri. eh-MEE-nee AH-roo TAY, OH-wo MAH-moo", translation: { en: "…The elder is right. Let us be at peace. We will mend the canoe — the two of us.", fr: "…L'aîné a raison. Faisons la paix. Nous réparerons la pirogue — tous les deux." }, verify: true, startTime: 65, endTime: 73 },
    { seq: 14, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Seri emi. Egberi tẹidẹ. Mu, seri fịmọ.", roman: "SEH-ri EH-mee. eh-GBEH-ri TAY-deh. moo, SEH-ri FEE-maw", translation: { en: "There is peace. The matter is tied up. Go, and keep the peace.", fr: "Il y a la paix. L'affaire est réglée. Allez, et gardez la paix." }, verify: true, startTime: 73, endTime: 80 },
    { seq: 15, kind: "pause", text: "3s." },
    // Reflection beat — Tari names what just happened.
    { seq: 16, kind: "screen", text: "The proverb appears in full Izon; its 'canoe' echoes the Episode-4 river illustration." },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-tari", text: "Ọfọn kẹnị… egberi tẹi. Amaokowei ọfọn nimi.", roman: "AW-fawn KEH-nee… eh-GBEH-ri TAY. ah-mah-OH-koh-way AW-fawn NEE-mee", translation: { en: "One word… and the matter is bound. The elder knows how words work.", fr: "Un seul mot… et l'affaire est liée. L'aîné sait ce que peuvent les mots." }, verify: true, startTime: 83, endTime: 90 },
    { seq: 18, kind: "sfx", text: "Assembly murmur resumes, approving; ambient fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-amaokowei", direction: "Never raises volume; authority is in restraint and timing. The proverb is delivered almost gently." },
      { character: "izon-cast-timi", direction: "Aggrieved, fast, then humbled — the arc of a man who hears sense." },
      { character: "izon-cast-tari", direction: "Now the narrator/observer — grown enough to comment on the language itself." },
    ],
    soundDesign: [
      "Assembly bed: benches, heat, cicadas, the single hand-raise silence.",
      "The proverb sits in clean air — pull ambient down under it, let it ring.",
    ],
    music: ["None."],
    visuals: [
      "The proverb rendered large in Izon; canoe motif ties back to Episode 4.",
      "A 'peace restored' beat — the two men's chips move back together.",
    ],
    notes: "The season's turn: the learner-surrogate now narrates. Proverb is from the codebase set; confirm exact wording/tone with an elder before recording.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/proverbs/izon.ts (pv-iz-18 paddlers-argue; pv-iz-9 broken-canoe; pv-iz-4 words/bundle)",
    "userio-docs/izon_master_dictionary.csv (beri, seri/seridẹ, inyo/aghaịn, nimi, arụ, gbẹin, kọn)",
    "design-course izon.pack.ts (amaokowei = assembly/chief)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// A2 — IMMERSIVE STORY (medium) — "Woyengi Egberi — The Story of Woyengi"
// ─────────────────────────────────────────────────────────────────────────────
const A2: PodcastEpisode = {
  id: "izon-pod-a2",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-ot",
  order: 8,
  level: "advanced",
  style: "immersive_story",
  length: "medium",
  targetMinutes: 15,
  title: { en: "Episode 8 — The Story of Woyengi", fr: "Épisode 8 — L'Histoire de Woyengi" },
  description: {
    en: "By lamplight Ebiere tells Tari the Izon creation story: Woyengi, the great mother, who moulded humankind from earth and let each choose their own destiny. Follow an extended traditional narrative and retell it in your own words.",
    fr: "À la lampe, Ebiere raconte à Tari l'histoire de la création izon : Woyengi, la grande mère, qui façonna l'humanité et laissa chacun choisir son destin. Suivez un récit traditionnel étendu et racontez-le.",
  },
  canDo: {
    en: "Follow an extended traditional narrative in the storytelling past tense, and retell its spine, in Izon.",
    fr: "Suivre un récit traditionnel étendu au passé narratif, et en raconter la trame, en izon.",
  },
  logline: {
    en: "Before there were people, there was the Mother, the clay, and the choosing.",
    fr: "Avant les hommes, il y avait la Mère, l'argile et le choix.",
  },
  cefr: "C1",
  movementId: "mv_elders_voice",
  pillars: ["cosmology_ancestors", "arts_oratory", "rites_of_passage"],
  place: "compound",
  skills: ["listening", "reading", "speaking", "vocabulary"],
  cast: ["izon-cast-ebiere", "izon-cast-tari"],
  recycledFrom: ["izon-pod-b2"],
  newVocabTarget: 12,
  targetVocab: [
    { izon: "Woyengi", roman: "wo-YEN-gee", gloss: { en: "the creator mother-goddess", fr: "la déesse-mère créatrice" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "tamuno", roman: "tah-MOO-no", gloss: { en: "God / creator", fr: "Dieu / créateur" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "ebi", roman: "EH-bee", gloss: { en: "clay / earth (also 'good')", fr: "argile / terre" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "fiyowei", roman: "fee-YOH-way", gloss: { en: "life / breath", fr: "vie / souffle" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "ogbo", roman: "OG-bo", gloss: { en: "destiny / fate", fr: "destin" }, source: "mobile/lib/data/cultural/izon.ts", verify: true },
    { izon: "ereibi", roman: "eh-reh-EE-bee", gloss: { en: "the creation chair", fr: "le trône de création" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "daubọ", roman: "DAH-oo-baw", gloss: { en: "ancestors / those before us", fr: "les ancêtres" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "kịmị", roman: "KEE-mee", gloss: { en: "person / human being", fr: "personne" }, source: "izon_master_dictionary.csv" },
    { izon: "pẹrị", roman: "PEH-ri", gloss: { en: "to want / choose", fr: "vouloir / choisir" }, verify: true },
    { izon: "egberi", roman: "eh-GBEH-ri", gloss: { en: "story / account", fr: "récit" }, source: "proverbs/izon.ts" },
    { izon: "beke ye", roman: "BEH-keh yeh", gloss: { en: "long ago / in the old time", fr: "il y a longtemps" }, source: "izon_master_dictionary.csv", verify: true },
    { izon: "fịn", roman: "feen", gloss: { en: "sky / heaven", fr: "ciel" }, source: "izon_master_dictionary.csv (efinarụ = 'sky-canoe' = aeroplane)", verify: true },
  ],
  grammarPoints: [
    {
      point: { en: "The narrative past — telling what happened", fr: "Le passé narratif — raconter" },
      explanation: {
        en: "Storytelling uses the completed-action past (verb + -mị) strung with connectors: '…bomị' (came), '…teimị' (did), '…fịmị' (ate). A tale opens with a time-setter — 'Beke ye…' (long ago) — and chains events. This is the tense you have been hearing since Episode 2's story beats; now you produce it.",
        fr: "Le récit emploie le passé accompli (verbe + -mị) enchaîné par des connecteurs, et s'ouvre par un marqueur de temps — 'Beke ye…' (il y a longtemps).",
      },
      examples: [
        { izon: "Beke ye, Woyengi bomị.", roman: "BEH-keh yeh, wo-YEN-gee BOH-mee", gloss: { en: "Long ago, Woyengi came.", fr: "Il y a longtemps, Woyengi vint." }, verify: true },
        { izon: "Woyengi kịmị teimị.", roman: "wo-YEN-gee KEE-mee TAY-mee", gloss: { en: "Woyengi made human beings.", fr: "Woyengi fit les êtres humains." }, verify: true },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "Woyengi — the Mother who lets you choose", fr: "Woyengi — la Mère qui laisse choisir" },
      body: {
        en: "In Izon cosmology Woyengi ('Our Mother') descends on lightning to Oporoma, sits on the creation chair, moulds each person from earth, and — uniquely — lets each choose their own gender, gifts, manner of life and death before birth. Fate and free will are tied together. Her most famous telling is the tragedy of Ogboinba, who tried to change the destiny she had chosen.",
        fr: "Dans la cosmologie izon, Woyengi ('Notre Mère') descend sur la foudre à Oporoma, façonne chaque personne dans la terre et lui laisse choisir son destin avant la naissance. Le destin et le libre arbitre sont liés.",
      },
      tags: ["creation_myths", "cosmology"],
    },
    {
      title: { en: "Night is the time for stories", fr: "La nuit est le temps des récits" },
      body: {
        en: "Folktales (egberi) are told after dark, never in daytime — daytime telling is said to bring misfortune. The fireside tale is how cosmology, ethics and language are handed down; the listener answers cues to keep the teller company. This is heritage: source the exact wording from a keeper, and credit them.",
        fr: "Les contes (egberi) se disent après la tombée de la nuit, jamais le jour. Le récit au coin du feu transmet cosmologie, éthique et langue. C'est un patrimoine : sourcez le texte exact auprès d'un gardien, et créditez-le.",
      },
      tags: ["oral_tradition", "arts_oratory"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: deep night compound — one oil lamp hissing, crickets, distant creek, a low fire. Hold 20s." },
    { seq: 2, kind: "screen", text: "Illustration: a lamp between two seated figures, everything else dark. No text." },
    { seq: 3, kind: "dialogue", speaker: "izon-cast-tari", text: "Ebiere, egberi kẹnị gba ee. Woyengi egberi.", roman: "eh-bee-EH-reh, eh-GBEH-ri KEH-nee gbah eh. wo-YEN-gee eh-GBEH-ri", translation: { en: "Ebiere, tell me a story. The story of Woyengi.", fr: "Ebiere, raconte-moi une histoire. L'histoire de Woyengi." }, verify: true, startTime: 20, endTime: 27 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Agụ mie. Egberi agụra gba, dein-a gbagha. Nimi?", roman: "AH-goo MEE-eh. eh-GBEH-ri ah-GOO-ra gbah, DAYN-ah GBAH-gha. NEE-mee", translation: { en: "Night has come. Stories are told at night, never by day. You understand?", fr: "La nuit est venue. Les contes se disent la nuit, jamais le jour. Tu comprends ?" }, verify: true, startTime: 27, endTime: 35 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-tari", text: "Nimi. Emịnị dii.", roman: "NEE-mee. eh-MEE-nee dee", translation: { en: "I understand. I'm listening.", fr: "Je comprends. J'écoute." }, verify: true, startTime: 35, endTime: 39 },
    { seq: 6, kind: "note", text: "Call-and-response opening — the listener consents. This is how a telling begins." },
    { seq: 7, kind: "pause", text: "2s." },
    // The tale — extended traditional narrative. HERITAGE placeholder.
    { seq: 8, kind: "screen", text: "Illustration shifts slowly with the tale (sky/lightning → the chair → the clay figures → two women at a river). Minimal; no text." },
    { seq: 9, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON CREATION NARRATIVE — Part 1 (~6 sentences): Beke ye… — long ago there was only Woyengi, Our Mother. She came down on the lightning to Oporoma, and set up her creation chair (ereibi). She took the earth (ebi) in her hands and moulded the human beings, and breathed life (fiyowei) into them. — MUST be sourced verbatim from a verified Izon keeper; do not fabricate.]]", translation: { en: "(Part 1 — Long ago there was only Woyengi, Our Mother. She descended on lightning to Oporoma, set up her creation chair, moulded human beings from earth and breathed life into them.)", fr: "(Partie 1 — Il n'y avait que Woyengi, Notre Mère. Elle descendit sur la foudre à Oporoma, façonna les humains dans la terre et leur insuffla la vie.)" }, verify: true, startTime: 41, endTime: 95 },
    { seq: 10, kind: "sfx", text: "A soft roll of distant thunder under the telling — sparingly." },
    { seq: 11, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON CREATION NARRATIVE — Part 2 (~6 sentences): Woyengi let each person choose — to be man or woman, rich or poor, the manner of their life and the manner of their death (ogbo, destiny). Then she sent them to earth by two paths: the water and the land. And what a person chose at her knee, that became their life. — verified keeper source required.]]", translation: { en: "(Part 2 — Woyengi let each person choose their gender, fortune, and the manner of their life and death — their destiny — then sent them to earth by water and by land; what one chose at her knee became their life.)", fr: "(Partie 2 — Woyengi laissa chacun choisir son genre, sa fortune, sa vie et sa mort — son destin — puis les envoya sur terre ; ce qu'on choisissait à son genou devenait sa vie.)" }, verify: true, startTime: 95, endTime: 150 },
    { seq: 12, kind: "note", text: "Optional extension: the Ogboinba tragedy (she who tried to un-choose her destiny). Only with a keeper's telling." },
    { seq: 13, kind: "pause", text: "3s — the tale lands." },
    { seq: 14, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Enị ogbo, ị pẹrịmị. Kịmị fụọ, ogbo fụọ.", roman: "EH-nee OG-bo, ee PEH-ri-mee. KEE-mee FOO-aw, OG-bo FOO-aw", translation: { en: "Your destiny, you yourself chose it. Every person, their own fate.", fr: "Ton destin, c'est toi qui l'as choisi. Chaque personne, son propre sort." }, verify: true, startTime: 153, endTime: 160 },
    { seq: 15, kind: "pause", text: "3s." },
    // Retell beat — the C1 production task.
    { seq: 16, kind: "screen", text: "Three story-card icons in sequence: lightning → chair → clay figures. Prompts a retelling, no text." },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-tari", text: "Beke ye, Woyengi bomị. Ereibi timi, kịmị teimị. Ebi kọn, fiyowei piri.", roman: "BEH-keh yeh, wo-YEN-gee BOH-mee. eh-reh-EE-bee TEE-mee, KEE-mee TAY-mee. EH-bee kawn, fee-YOH-way PEE-ri", translation: { en: "Long ago, Woyengi came. She sat on the chair, she made people. She took clay, she gave life.", fr: "Il y a longtemps, Woyengi vint. Elle s'assit sur le trône, fit les gens. Elle prit l'argile, donna la vie." }, verify: true, startTime: 163, endTime: 172 },
    { seq: 18, kind: "note", text: "Tari retells the tale's spine in the narrative past — the episode's real production goal. Learner mirrors before this line." },
    { seq: 19, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Ị egberi nimidẹ. Daubọ ọfọn, ị bọ kọndẹ. Baịyo, tụbọụ.", roman: "ee eh-GBEH-ri nee-MEE-deh. DAH-oo-baw AW-fawn, ee baw KAWN-deh. BY-yo, TOO-bow", translation: { en: "You have learned the story. The ancestors' words, you now carry them. Good night, child.", fr: "Tu as appris l'histoire. Les paroles des ancêtres, tu les portes maintenant. Bonne nuit, mon enfant." }, verify: true, startTime: 172, endTime: 181 },
    { seq: 20, kind: "sfx", text: "Lamp lowered; crickets swell; fade to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-ebiere", direction: "Master storyteller. Slightly slower than conversation, not artificially slow; uses the call-and-response cues; lets thunder and silence do work." },
      { character: "izon-cast-tari", direction: "The rapt listener who, by the end, can carry the tale's spine. The retelling should sound earned." },
    ],
    soundDesign: [
      "Intimate night bed: single oil lamp hiss, crickets, low fire, far creek.",
      "Sparse distant thunder motif tied to Woyengi's lightning descent.",
      "No music; the voice and the night are the whole soundscape.",
    ],
    music: ["None."],
    visuals: [
      "Slow story-illustration cross-fades (lightning → creation chair → clay figures → the two paths).",
      "Retell prompt: three ordered icons, no text — learner narrates.",
      "First advanced episode to reveal extended written Izon (Script Reveal) of the retold spine.",
    ],
    notes: "HERITAGE. The Woyengi narrative MUST be recorded from a verified Izon keeper — the bracketed parts are structure, not final text. Attribute the teller. Do not publish isActive until sourced.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/cultural/izon.ts (Woyengi creation story: Oporoma, creation chair, clay, chosen destiny; tamuno/ebi/fiyowei/ogbo/ereibi; daubọ)",
    "userio-docs/izon_master_dictionary.csv (kịmị, egberi, narrative -mị past forms)",
    "web/oral-tradition: Woyengi & Ogboinba (Izon cosmology) — source verbatim from a keeper before recording",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// A3 — HOST-NARRATED (long) — "Bou Fụrọ — Pouring the Water" (season finale)
// ─────────────────────────────────────────────────────────────────────────────
const A3: PodcastEpisode = {
  id: "izon-pod-a3",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-ot",
  order: 9,
  level: "advanced",
  style: "host_narrated",
  length: "long",
  targetMinutes: 19,
  title: { en: "Episode 9 — Pouring the Water", fr: "Épisode 9 — Verser l'Eau" },
  description: {
    en: "The season's festival. Pa Boma pours libation to the ancestors and the water spirits, and — for the first time — Tari stands to speak a short praise for the family. The language of blessing, thanks, and belonging, at its summit.",
    fr: "La fête de la saison. Pa Boma verse la libation aux ancêtres et aux esprits de l'eau, et — pour la première fois — Tari se lève pour dire une louange pour la famille. Le langage de la bénédiction, à son sommet.",
  },
  canDo: {
    en: "Recognise the language of libation and blessing, and follow a short praise spoken for a family, in Izon.",
    fr: "Reconnaître le langage de la libation et de la bénédiction, et suivre une courte louange dite pour une famille, en izon.",
  },
  logline: {
    en: "The long way home ends where it began — at the water. This time, Tari speaks.",
    fr: "Le long chemin du retour s'achève là où il a commencé — à l'eau. Cette fois, Tari parle.",
  },
  cefr: "C2",
  movementId: "mv_keeper",
  pillars: ["cosmology_ancestors", "rites_of_passage", "arts_oratory", "kinship_belonging"],
  place: "sacred_grove",
  skills: ["listening", "speaking", "reading"],
  cast: ["izon-cast-amaokowei", "izon-cast-ebiere", "izon-cast-tari", "izon-cast-ere"],
  recycledFrom: ["izon-pod-b1", "izon-pod-b2", "izon-pod-i2", "izon-pod-a2"],
  newVocabTarget: 10,
  targetVocab: [
    { izon: "bou fụrọ", roman: "boh FOO-raw", gloss: { en: "to pour water / libation", fr: "verser l'eau / la libation" }, verify: true },
    { izon: "daubọ", roman: "DAH-oo-baw", gloss: { en: "the ancestors", fr: "les ancêtres" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "owuamapu", roman: "oh-woo-AH-mah-poo", gloss: { en: "the water spirits", fr: "les esprits de l'eau" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "seigbein", roman: "say-GBAYN", gloss: { en: "festival of remembrance / appeasement", fr: "fête de commémoration" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "fie", roman: "fee-eh", gloss: { en: "peace / calm", fr: "paix" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "amọ / ama", roman: "AH-maw / ah-MAH", gloss: { en: "the town / community", fr: "la communauté" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "kuro", roman: "KOO-ro", gloss: { en: "health / wellbeing", fr: "santé / bien-être" }, source: "izon_master_dictionary.csv" },
    { izon: "tọrụ angọ", roman: "TOH-roo AN-gaw", gloss: { en: "the source of the river", fr: "la source de la rivière" }, source: "proverbs/izon.ts (pv-iz-16)" },
    { izon: "bọ / ineé", roman: "baw / ee-NEH", gloss: { en: "come / remember", fr: "venir / se souvenir" }, source: "Izon dictionary.pdf (ineé ukie = 'think of me')", verify: true },
    { izon: "Ịzọn didi", roman: "EE-zon DEE-dee", gloss: { en: "Izon is proud / long live Izon", fr: "fierté izon" }, verify: true },
  ],
  grammarPoints: [
    {
      point: { en: "The optative — blessing and wish", fr: "L'optatif — bénédiction et vœu" },
      explanation: {
        en: "Blessings are wishes: 'may X happen'. Izon libation strings vocatives (calling the ancestors, the water, the town) with wish-forms — 'may the town have peace', 'may the fish return', 'may the child be well'. This is the highest register: naming what is holy, then wishing good upon the living. Exact forms must come from a keeper.",
        fr: "Les bénédictions sont des vœux : 'que X advienne'. La libation izon enchaîne des vocatifs (les ancêtres, l'eau, la ville) avec des formes de souhait. Registre le plus élevé ; les formes exactes viennent d'un gardien.",
      },
      examples: [
        { izon: "Amọ fie mie.", roman: "AH-maw fee-eh MEE-eh", gloss: { en: "May the town have peace.", fr: "Que la ville ait la paix." }, verify: true },
        { izon: "Toru angọ kụlụ bogha.", roman: "TOH-roo AN-gaw KOO-loo BOH-gha", gloss: { en: "The river does not forget its source.", fr: "La rivière n'oublie pas sa source." }, source: "proverbs/izon.ts (pv-iz-16)" },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "Libation — speaking to the water and the dead", fr: "La libation — parler à l'eau et aux morts" },
      body: {
        en: "Pouring libation (gin, water, or palm-wine tipped to the earth) opens any major Izon rite. The pourer calls the ancestors (daubọ) and the water spirits (owuamapu) by name, thanks them, and asks peace and increase for the living. The words are near-scripture — improvised within a fixed frame, and specific to family and clan. They must be sourced from a verified elder or priest; never invented.",
        fr: "Verser la libation (gin, eau ou vin de palme sur la terre) ouvre tout grand rite izon. Celui qui verse appelle les ancêtres (daubọ) et les esprits (owuamapu) par leur nom. Les paroles sont quasi-scripturaires ; à sourcer auprès d'un aîné ou prêtre vérifié.",
      },
      tags: ["cosmology", "rites_of_passage", "festivals"],
    },
    {
      title: { en: "Seigbein and the withdrawn spirits", fr: "Seigbein et les esprits retirés" },
      body: {
        en: "Seigbein is a festival of remembrance and appeasement for the Owuamapu — the water spirits who taught the people to fish and then withdrew when the waters were fouled. In this finale the season's threads close: the fewer fish (Ep. 4), the masquerade (Ep. 5), and the ancestors' words (Ep. 8) meet at the water's edge.",
        fr: "Seigbein est une fête de commémoration et d'apaisement pour les Owuamapu — les esprits de l'eau qui enseignèrent la pêche puis se retirèrent. Le final noue les fils de la saison.",
      },
      tags: ["festivals", "cosmology", "environment"],
    },
    {
      title: { en: "A newcomer speaking = the whole point", fr: "Un nouveau venu qui parle = tout l'enjeu" },
      body: {
        en: "That an outsider-become-family can rise and speak a few true words at the water is the emotional and pedagogical summit of the series: the learner has arrived. Tari's praise is deliberately SHORT and simple — mastery here is not fluency but the right words, well-placed, before the community.",
        fr: "Qu'un étranger devenu famille puisse se lever et dire quelques mots justes à l'eau est le sommet de la série : l'apprenant est arrivé. La louange de Tari est volontairement brève.",
      },
      tags: ["kinship", "arts_oratory"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: the water's edge at the festival — a great crowd hushing, drums resting, wavelets, wind in raffia. Hold 20s." },
    { seq: 2, kind: "screen", text: "Illustration: the whole town gathered at the creek bank, an elder at the front with a glass and a bottle. No text." },
    // Host-narration frame — Ebiere, in Izon, closing the season's arc.
    { seq: 3, kind: "narration", speaker: "izon-cast-ebiere", text: "Seigbein bo. Amọ toru buma. Daubọ, owuamapu — owo ineé.", roman: "say-GBAYN boh. AH-maw TOH-roo BOO-ma. DAH-oo-baw, oh-woo-AH-mah-poo — OH-wo ee-NEH", translation: { en: "Seigbein has come. The whole town is at the water. The ancestors, the water spirits — we remember them.", fr: "Seigbein est venu. Toute la ville est à l'eau. Les ancêtres, les esprits de l'eau — nous nous souvenons d'eux." }, verify: true, startTime: 20, endTime: 29 },
    { seq: 4, kind: "sfx", text: "The crowd stills completely; a single throat clears — Pa Boma steps to the water." },
    // LIBATION — heritage placeholder, the most guarded content in the series.
    { seq: 5, kind: "screen", text: "Illustration: the elder tipping the glass to the earth, the crowd's heads bowed. No text." },
    { seq: 6, kind: "narration", speaker: "izon-cast-amaokowei", text: "[[IZON LIBATION — Part 1 (~5 lines): the vocative call — 'Woyengi, Our Mother; you the ancestors; you the owuamapu of this creek — come, receive this water.' Followed by the thanks. MUST be provided verbatim by a verified Izon elder / Egbesu or Ekine authority. NOT to be fabricated. Improvised within a fixed frame — record a real pouring with permission and full credit.]]", translation: { en: "(Part 1 — the vocative: Pa Boma calls Woyengi, the ancestors, and the water spirits of the creek to come and receive the libation, and gives thanks.)", fr: "(Partie 1 — le vocatif : Pa Boma appelle Woyengi, les ancêtres et les esprits de l'eau à recevoir la libation, et rend grâce.)" }, verify: true, startTime: 33, endTime: 95 },
    { seq: 7, kind: "sfx", text: "Liquid poured to earth; a low communal 'Iyaa' of assent after each line." },
    { seq: 8, kind: "narration", speaker: "izon-cast-amaokowei", text: "[[IZON LIBATION — Part 2 (~5 lines): the petition/blessing — 'may the town have peace (amọ fie mie); may the fish come home to the nets again; may our children be well; may the stranger who came be a son of this water.' verified source required.]]", translation: { en: "(Part 2 — the blessing: may the town have peace, may the fish return to the nets, may the children be well, may the newcomer be a child of this water.)", fr: "(Partie 2 — la bénédiction : que la ville ait la paix, que le poisson revienne, que les enfants aillent bien, que le nouveau venu soit un enfant de cette eau.)" }, verify: true, startTime: 95, endTime: 150 },
    { seq: 9, kind: "note", text: "The blessing folds in the season's threads: peace (Ep.7), the fish returning (Ep.4), and the newcomer belonging (Ep.1). Heritage — do not fabricate; source verbatim." },
    { seq: 10, kind: "pause", text: "3s — the poured water soaks in; the crowd breathes." },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Ebiere warị, ọfọn emi. Tari — bo, ọfọn gba.", roman: "eh-bee-EH-reh WAH-ri, AW-fawn EH-mee. TAH-ri — boh, AW-fawn gbah", translation: { en: "The house of Ebiere has words to say. Tari — come, speak.", fr: "La maison d'Ebiere a des paroles à dire. Tari — viens, parle." }, verify: true, startTime: 153, endTime: 161 },
    { seq: 12, kind: "sfx", text: "A murmur of surprise — the returnee, the city one, is being asked to speak. Then silence, and Tari steps forward." },
    { seq: 13, kind: "note", text: "The pivot the whole season built toward. Let the surprised murmur, then the hush, breathe." },
    // Tari's praise — SHORT, simple, true. The learner's summit; deliberately achievable.
    { seq: 14, kind: "dialogue", speaker: "izon-cast-tari", text: "Daubọ, doo. Owuamapu, doo. Emịnị Tari — emịnị bou mie, warị mie.", roman: "DAH-oo-baw, doh. oh-woo-AH-mah-poo, doh. eh-MEE-nee TAH-ri — eh-MEE-nee boh MEE-eh, WAH-ri MEE-eh", translation: { en: "Ancestors, thank you. Water spirits, thank you. I am Tari — I came to the creek, and I have come home.", fr: "Ancêtres, merci. Esprits de l'eau, merci. Je suis Tari — je suis venu au ruisseau, et je suis rentré chez moi." }, verify: true, startTime: 164, endTime: 174 },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-tari", text: "Emịnị Ịzọn ye. Amọ fie mie. Toru angọ kụlụ bogha. Ụmbana.", roman: "eh-MEE-nee EE-zon yeh. AH-maw fee-eh MEE-eh. TOH-roo AN-gaw KOO-loo BOH-gha. oom-BAH-na", translation: { en: "I am Izon. May the town have peace. The river does not forget its source. Thank you.", fr: "Je suis Izon. Que la ville ait la paix. La rivière n'oublie pas sa source. Merci." }, literal: "…river source forget NEG…", source: "proverbs/izon.ts (pv-iz-16)", verify: true, startTime: 174, endTime: 183 },
    { seq: 16, kind: "note", text: "Tari closes with the proverb 'the river does not forget its source' — the exact meaning of the homecoming, and a callback to Episode 1. Learner speaks Tari's praise in the second pass." },
    { seq: 17, kind: "sfx", text: "The crowd erupts — ululation, the great drum re-enters, Ekine bells. Ebiere's laugh cuts through." },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Ịzọn didi! Enị bọ ọfọn kọndẹ. Enị warị mie, tụbọụ.", roman: "EE-zon DEE-dee! EH-nee baw AW-fawn KAWN-deh. EH-nee WAH-ri MEE-eh, TOO-bow", translation: { en: "Izon is proud! You carry the words now. You have come home, child.", fr: "L'Izon est fier ! Tu portes les paroles maintenant. Tu es rentré chez toi, mon enfant." }, verify: true, startTime: 186, endTime: 194 },
    { seq: 19, kind: "note", text: "Ebiere's line = commemoration, not flattery (per her character brief). The season's emotional payoff." },
    { seq: 20, kind: "pause", text: "3s." },
    // Callback close — Episode 1's opening phrase returns, now fully understood.
    { seq: 21, kind: "screen", text: "The jetty illustration from Episode 1 returns; title card 'Bou Mie' fades in, Izon only." },
    { seq: 22, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Nụa, Tari. A bọọ bomaaa.", roman: "NOO-ah, TAH-ri. ah BAW boh-MAH", translation: { en: "Welcome, Tari. Welcome home.", fr: "Bienvenue, Tari. Bienvenue à la maison." }, source: "izon_master_dictionary.csv", startTime: 197, endTime: 202 },
    { seq: 23, kind: "note", text: "The exact welcome from Episode 1 (seq 4), incomprehensible then, is now the last, fully-understood line of the season. Full circle." },
    { seq: 24, kind: "sfx", text: "The Episode-1 jetty ambient rises one last time under the celebration, then fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-amaokowei", direction: "Ceremonial summit. The libation is chant-adjacent, measured, sacred. Record a REAL pouring with a keeper — do not act a fabricated text." },
      { character: "izon-cast-ebiere", direction: "Narrator and matriarch; her final 'you carry the words now' is the whole series in one line — earned, not sentimental." },
      { character: "izon-cast-tari", direction: "Nervous but true; the praise is short and slightly shaky — that is the point. Contrast with Episode 1's mumbled first greeting." },
      { character: "izon-cast-ere", direction: "Present in the crowd; his relief that peace/increase is asked for closes his environmental thread." },
    ],
    soundDesign: [
      "Vast waterfront crowd that can go from full roar to total hush on the elder's step.",
      "Libation foley: liquid to earth, the communal 'Iyaa' after each line.",
      "Full Ekine drum + bells re-entry on Tari's finish (attributed).",
      "Final callback: the Episode-1 jetty ambient, bookending the season.",
    ],
    music: ["Traditional Ekine/festival drumming at the eruption and close only; never under the libation or speech."],
    visuals: [
      "Libation illustration (glass to earth, bowed heads) — no text during sacred speech.",
      "Tari's praise appears as written Izon (Script Reveal) — the learner reads what they can now say.",
      "Episode-1 jetty callback illustration + 'Bou Mie' title card in Izon.",
    ],
    notes: "SEASON FINALE and the most heritage-sensitive episode. The libation MUST be a verbatim recording/transcription from a verified Izon elder, Egbesu or Ekine authority, with permission and credit — the bracketed text is scaffold only. isActive stays false until sourced. Tari's own praise is authored-simple and only needs a native-speaker polish.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/cultural/izon.ts (Seigbein, Owuamapu, owu, daubọ, fie, amọ, Woyengi)",
    "mobile/lib/data/proverbs/izon.ts (pv-iz-16 'the river does not forget its source')",
    "mobile/lib/data/lessons/izon-first-words.ts (Emịnị Ịzọn ye, Ịzọn didi); izon_master_dictionary.csv (A bọọ bomaaa, daubọ, kuro)",
    "HERITAGE: libation text to be sourced verbatim from a verified Izon elder / Egbesu or Ekine authority",
  ],
};

export const IZON_PODCAST_ADVANCED: PodcastEpisode[] = [A1, A2, A3];
