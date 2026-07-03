/**
 * "The Long Way Home" — INTERMEDIATE episodes (A2–B1)
 *   I1  izon-pod-i1  · SKIT           · short  (~8 min)  — down to the river; fewer fish
 *   I2  izon-pod-i2  · IMMERSIVE STORY · medium (~14 min) — the Ekine masquerade arrives
 *   I3  izon-pod-i3  · HOST-NARRATED  · long   (~18 min) — a union: two families meet
 *
 * At A2–B1 the connected speech outruns the verified single-word corpus, so
 * more lines carry verify:true, and heritage/ceremonial speech is a
 * [[bracketed placeholder]] to be composed and recorded with a native speaker
 * or cultural authority. All episodes isActive:false.
 */

import type { PodcastEpisode } from "../podcast-types";

const SERIES = "izon-pod-longwayhome";

// ─────────────────────────────────────────────────────────────────────────────
// I1 — SKIT (short) — "Toru Bilaa — Down to the River"
// ─────────────────────────────────────────────────────────────────────────────
const I1: PodcastEpisode = {
  id: "izon-pod-i1",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-el",
  order: 4,
  level: "intermediate",
  style: "skit",
  length: "short",
  targetMinutes: 8,
  title: { en: "Episode 4 — Down to the River", fr: "Épisode 4 — Vers la Rivière" },
  description: {
    en: "Before dawn, Tari joins Timi and Uncle Ere to fish. Give and follow simple commands (paddle, throw the net, be quiet), talk about the catch, and hear the elders' quiet worry that the fish are fewer.",
    fr: "Avant l'aube, Tari rejoint Timi et Oncle Ere pour pêcher. Donnez et suivez des ordres simples, parlez de la prise et entendez l'inquiétude des aînés : il y a moins de poissons.",
  },
  logline: {
    en: "The creek gives less than it used to. The old men have noticed.",
    fr: "Le ruisseau donne moins qu'avant. Les vieux l'ont remarqué.",
  },
  cefr: "A2",
  movementId: "mv_working_year",
  pillars: ["land_livelihood", "cosmology_ancestors"],
  place: "water_land",
  skills: ["listening", "speaking", "grammar"],
  cast: ["izon-cast-tari", "izon-cast-timi", "izon-cast-ere"],
  recycledFrom: ["izon-pod-b2", "izon-pod-b3"],
  newVocabTarget: 12,
  targetVocab: [
    { izon: "toru", roman: "TOH-roo", gloss: { en: "river", fr: "rivière" }, source: "izon_master_dictionary.csv" },
    { izon: "bou", roman: "boh", gloss: { en: "creek", fr: "ruisseau" }, source: "design-course izon.pack.ts / cultural" },
    { izon: "arụ", roman: "AH-roo", gloss: { en: "canoe", fr: "pirogue" }, source: "izon_master_dictionary.csv" },
    { izon: "yọụ", roman: "yaw", gloss: { en: "to paddle", fr: "pagayer" }, source: "izon_master_dictionary.csv" },
    { izon: "oki", roman: "OH-kee", gloss: { en: "to swim", fr: "nager" }, source: "izon_master_dictionary.csv" },
    { izon: "endi", roman: "EN-dee", gloss: { en: "fish", fr: "poisson" }, source: "izon_master_dictionary.csv" },
    { izon: "neti", roman: "NEH-tee", gloss: { en: "net (loanword)", fr: "filet" }, source: "proverbs/izon.ts ('neti ma bo')", verify: true },
    { izon: "beni", roman: "BEH-nee", gloss: { en: "water", fr: "eau" }, source: "izon_master_dictionary.csv" },
    { izon: "zu", roman: "zoo", gloss: { en: "to fetch/bail water", fr: "puiser l'eau" }, source: "izon_master_dictionary.csv" },
    { izon: "kọn", roman: "kawn", gloss: { en: "take / hold", fr: "prendre / tenir" }, source: "izon_master_dictionary.csv ('kọn bo' = bring)" },
    { izon: "opu / kala", roman: "OH-poo / KAH-la", gloss: { en: "big / small", fr: "grand / petit" }, source: "izon_master_dictionary.csv" },
    { izon: "faa", roman: "fah", gloss: { en: "there is none / not", fr: "il n'y en a pas" }, source: "izon_master_dictionary.csv" },
  ],
  grammarPoints: [
    {
      point: { en: "Commands (imperative): bare verb", fr: "L'impératif : le verbe nu" },
      explanation: {
        en: "A command is just the verb, often with 'ee' for politeness: 'Yọụ!' (Paddle!), 'Yọụ ee!' (Please paddle!), 'Bo!' (Come!), 'Mu!' (Go!), 'Kọn bo!' (Bring it!). Negative command adds -gha/faa: 'bogha' = did not come.",
        fr: "Un ordre est simplement le verbe, souvent avec 'ee' pour la politesse : 'Yọụ !' (Pagaie !), 'Bo !' (Viens !), 'Mu !' (Va !).",
      },
      examples: [
        { izon: "Yọụ ee!", roman: "yaw eh", gloss: { en: "Paddle, please!", fr: "Pagaie, s'il te plaît !" }, verify: true },
        { izon: "Neti kọn bo!", roman: "NEH-tee kawn boh", gloss: { en: "Bring the net!", fr: "Apporte le filet !" }, verify: true },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "The creek is the livelihood — and it is changing", fr: "Le ruisseau est la subsistance — et il change" },
      body: {
        en: "Fishing is the spine of Izon economic life; children learn to paddle before they can read. But oil pollution and overfishing have thinned the catch across the Delta, and elders read the water like a diary. This worry threads through the whole season.",
        fr: "La pêche est la colonne vertébrale de la vie izon ; les enfants pagaient avant de lire. Mais la pollution pétrolière et la surpêche ont réduit les prises dans tout le Delta.",
      },
      tags: ["land_livelihood", "environment"],
    },
    {
      title: { en: "Silence on the water", fr: "Le silence sur l'eau" },
      body: {
        en: "Fishers keep quiet near the nets — partly craft, partly respect for the owu (water spirits) believed to move in the deep creeks. Noise scatters fish and, some say, offends what lives below.",
        fr: "Les pêcheurs se taisent près des filets — par métier et par respect pour les owu (esprits de l'eau) que l'on croit présents dans les ruisseaux profonds.",
      },
      tags: ["cosmology", "land_livelihood"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: pre-dawn creek — paddle dips, a single bird, water beading off wood. Very quiet. Hold 20s." },
    { seq: 2, kind: "screen", text: "Illustration: two figures low in a canoe, mist on black water, first grey light. No text." },
    { seq: 3, kind: "dialogue", speaker: "izon-cast-timi", text: "Tari, yọụ ee. Kala kala. Endi nimi.", roman: "TAH-ri, yaw eh. KAH-la KAH-la. EN-dee NEE-mee", translation: { en: "Tari, paddle. Softly, softly. The fish are here.", fr: "Tari, pagaie. Doucement, doucement. Les poissons sont là." }, verify: true, startTime: 20, endTime: 26 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-tari", text: "Emi yọụ… duọ, oki nimigha!", roman: "EH-mee yaw… doo-aw, OH-kee nee-MEE-gha", translation: { en: "I'm paddling… but I can't swim!", fr: "Je pagaie… mais je ne sais pas nager !" }, verify: true, startTime: 26, endTime: 31 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-timi", text: "Haa! Ị Ịzọn ye, ị oki nimigha? Tari!", roman: "hah! ee EE-zon yeh, ee OH-kee nee-MEE-gha? TAH-ri", translation: { en: "Ha! You are Izon and you can't swim? Tari!", fr: "Ha ! Tu es Izon et tu ne sais pas nager ? Tari !" }, verify: true, startTime: 31, endTime: 37 },
    { seq: 6, kind: "dialogue", speaker: "izon-cast-ere", text: "Beri faa. Fịye faa. Neti kọn bo.", roman: "BEH-ri fah. FEE-yeh fah. NEH-tee kawn boh", translation: { en: "Quiet. No talking. Bring the net.", fr: "Silence. On ne parle pas. Apporte le filet." }, verify: true, startTime: 37, endTime: 43 },
    { seq: 7, kind: "note", text: "Uncle Ere speaks rarely; when he does, everyone obeys. Beat of real silence after this line." },
    { seq: 8, kind: "sfx", text: "Net cast — a soft spreading splash. Long pause. Water. One bird." },
    { seq: 9, kind: "pause", text: "3s of near-silence — the wait." },
    { seq: 10, kind: "dialogue", speaker: "izon-cast-timi", text: "Neti kọn! Kọn! … Endi mamụ. Kala endi.", roman: "NEH-tee kawn! kawn! … EN-dee MAH-moo. KAH-la EN-dee", translation: { en: "Pull the net! Pull! … Two fish. Small fish.", fr: "Tire le filet ! Tire ! … Deux poissons. Petits poissons." }, verify: true, startTime: 46, endTime: 53 },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-tari", text: "Mamụ pere? Opu endi faa?", roman: "MAH-moo PEH-reh? OH-poo EN-dee fah", translation: { en: "Only two? No big fish?", fr: "Deux seulement ? Pas de gros poisson ?" }, verify: true, startTime: 53, endTime: 58 },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-ere", text: "Bou pẹrị pẹrị. Endi pẹrị. Beke ye…", roman: "boh PEH-ri PEH-ri. EN-dee PEH-ri. BEH-keh yeh", translation: { en: "The creek gives little, little. Few fish. In the old days…", fr: "Le ruisseau donne peu, peu. Peu de poissons. Autrefois…" }, verify: true, startTime: 58, endTime: 65 },
    { seq: 13, kind: "note", text: "Ere trails off. The environmental thread — do NOT over-explain in audio; the tone carries it." },
    { seq: 14, kind: "dialogue", speaker: "izon-cast-ere", text: "Ọkọ kẹnị bẹ ama toru firigha-amị.", roman: "AW-kaw KEH-nee beh ah-MAH TOH-roo fee-REE-gha ah-MEE", translation: { en: "One canoe cannot cross the river alone.", fr: "Une seule pirogue ne traverse pas la rivière seule." }, literal: "canoe one NEG town river cross-NEG", source: "mobile/lib/data/proverbs/izon.ts (pv-iz-1)", startTime: 65, endTime: 71 },
    { seq: 15, kind: "note", text: "First proverb of the season, deployed by an elder in context — sets up the advanced level." },
    { seq: 16, kind: "pause", text: "3s." },
    // Command drill — recycle imperatives.
    { seq: 17, kind: "screen", text: "Icons for each command: paddle / bring / take / be quiet." },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-timi", text: "Yọụ! Kọn bo! Beri!", roman: "yaw! kawn boh! BEH-ri", translation: { en: "Paddle! Bring it! Quiet!", fr: "Pagaie ! Apporte ! Silence !" }, verify: true, startTime: 74, endTime: 79 },
    { seq: 19, kind: "pause", text: "4s each — learner performs each command (TPR)." },
    { seq: 20, kind: "sfx", text: "Paddles resume; the canoe turns for home; ambient fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-timi", direction: "Playful even at dawn; teases Tari about swimming." },
      { character: "izon-cast-tari", direction: "City-soft; the swimming admission is a real, funny vulnerability." },
      { character: "izon-cast-ere", direction: "Minimal, weathered; the worry lives in the silences, not the volume." },
    ],
    soundDesign: [
      "Signature near-silence — this is the quietest episode; let the water be the star.",
      "Net cast + pull foley; the disappointing 'small catch'.",
      "No music. Ambient only at head and tail.",
    ],
    visuals: [
      "Command icons for the TPR drill (paddle/bring/quiet).",
      "A subtle 'catch counter' that lands on 2 small fish — visual understatement.",
    ],
    notes: "TPR-forward: commands are meant to be physically obeyed. The proverb is a plant for Episode 7 (advanced). No interface language in audio.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "userio-docs/izon_master_dictionary.csv (toru, arụ, yọụ, oki, endi, beni, zu, kọn bo, opu/kala, faa)",
    "mobile/lib/data/proverbs/izon.ts (pv-iz-1 canoe proverb)",
    "mobile/lib/data/cultural/izon.ts (owu water spirits)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// I2 — IMMERSIVE STORY (medium) — "Ekine Bo — The Masquerade Comes"
// ─────────────────────────────────────────────────────────────────────────────
const I2: PodcastEpisode = {
  id: "izon-pod-i2",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-ot",
  order: 5,
  level: "intermediate",
  style: "immersive_story",
  length: "medium",
  targetMinutes: 14,
  title: { en: "Episode 5 — The Masquerade Comes", fr: "Épisode 5 — La Mascarade Arrive" },
  description: {
    en: "The town prepares for the Ekine water-spirit dance. Preye teaches Tari the colours and their meanings, the drum and the dance, and what the masquerade is really for. Colour words, ceremony vocabulary, and describing what you see.",
    fr: "La ville prépare la danse Ekine des esprits de l'eau. Preye enseigne à Tari les couleurs et leurs sens, le tambour et la danse. Les couleurs, le vocabulaire cérémoniel, décrire ce qu'on voit.",
  },
  logline: {
    en: "The drum calls the water spirits ashore. Tari learns to read the colours.",
    fr: "Le tambour appelle les esprits de l'eau à terre. Tari apprend à lire les couleurs.",
  },
  cefr: "B1",
  movementId: "mv_assembly",
  pillars: ["arts_oratory", "cosmology_ancestors", "time_seasons_festivals"],
  place: "festival_ground",
  skills: ["listening", "speaking", "vocabulary"],
  cast: ["izon-cast-tari", "izon-cast-preye", "izon-cast-ebiere"],
  recycledFrom: ["izon-pod-b1", "izon-pod-i1"],
  newVocabTarget: 12,
  targetVocab: [
    { izon: "ekine / sekiapu", roman: "eh-KEE-neh / seh-kee-AH-poo", gloss: { en: "the masquerade society ('the dancing people')", fr: "la société de mascarade" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "owu", roman: "OH-woo", gloss: { en: "water spirit / masquerade", fr: "esprit de l'eau" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "igbe", roman: "EEG-beh", gloss: { en: "drum", fr: "tambour" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "seki", roman: "SEH-kee", gloss: { en: "dance", fr: "danse" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "kwa-kwa", roman: "kwah-kwah", gloss: { en: "red — strength, power, royalty", fr: "rouge — force, pouvoir" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "pena-pena", roman: "PEH-na-PEH-na", gloss: { en: "white — purity, peace, holiness", fr: "blanc — pureté, paix" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "dirimo", roman: "dee-REE-mo", gloss: { en: "black — the deep, the unseen, secrecy", fr: "noir — l'obscur, le caché" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "ẹwiri", roman: "eh-WEE-ree", gloss: { en: "colour", fr: "couleur" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "bite", roman: "BEE-teh", gloss: { en: "cloth / wrapper", fr: "pagne / tissu" }, source: "mobile/lib/data/cultural/izon.ts" },
    { izon: "toru", roman: "TOH-roo", gloss: { en: "river / waterway", fr: "rivière" }, source: "izon_master_dictionary.csv" },
    { izon: "dii", roman: "dee", gloss: { en: "to look / see", fr: "regarder / voir" }, source: "izon_master_dictionary.csv ('bo dii')" },
    { izon: "ebi", roman: "EH-bee", gloss: { en: "good / beautiful", fr: "bon / beau" }, source: "izon-first-words.ts", verify: true },
  ],
  grammarPoints: [
    {
      point: { en: "Describing: NOUN + colour/quality", fr: "Décrire : NOM + couleur/qualité" },
      explanation: {
        en: "Qualities follow the noun: 'bite kwa-kwa' = red cloth, 'toru dirimo' = dark water, 'owu ebi' = a fine masquerade. Stack the naming pattern (Mị/Anị) from A1 with a colour to describe: 'Anị bite kwa-kwa' = that is red cloth.",
        fr: "Les qualités suivent le nom : 'bite kwa-kwa' = pagne rouge. On empile le schéma Mị/Anị avec une couleur : 'Anị bite kwa-kwa' = cela est un pagne rouge.",
      },
      examples: [
        { izon: "Anị bite kwa-kwa.", roman: "AH-nee BEE-teh kwah-kwah", gloss: { en: "That is red cloth.", fr: "Cela est un pagne rouge." }, verify: true },
        { izon: "Owu ebi!", roman: "OH-woo EH-bee", gloss: { en: "A beautiful masquerade!", fr: "Une belle mascarade !" }, verify: true },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "Ekine / Sekiapu — the water-spirit masquerade", fr: "Ekine / Sekiapu — la mascarade des esprits de l'eau" },
      body: {
        en: "One of the great Izon institutions: a society ('the dancing people') that performs the owu — water spirits of the creeks — through masked dance, each character with its own drum rhythm and steps. It is a bridge between the human and spirit worlds, danced at festivals and funerals. Membership and the sacred details are guarded; this episode stays on the public, celebratory surface.",
        fr: "L'une des grandes institutions izon : une société ('les danseurs') qui incarne les owu — esprits de l'eau — par la danse masquée, chaque personnage ayant son rythme. Un pont entre le monde humain et le monde des esprits.",
      },
      tags: ["festivals", "music", "cosmology"],
    },
    {
      title: { en: "Three mother-colours", fr: "Trois couleurs-mères" },
      body: {
        en: "Izon colour thought groups everything under three: kwa-kwa (red — strength, royalty), pena-pena (white — purity, peace), and dirimo (black — death, secrecy, the unseen). Masquerade cloth and body-art are read, not just admired: colour carries the message.",
        fr: "La pensée izon des couleurs regroupe tout sous trois : kwa-kwa (rouge), pena-pena (blanc) et dirimo (noir). Les couleurs de la mascarade se lisent : elles portent le message.",
      },
      tags: ["colors", "arts_oratory"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: festival ground filling — a drum being tuned, feet, excited children, distant water. Hold 15s." },
    { seq: 2, kind: "screen", text: "Illustration: a square by the water, a great drum, cloth drying in red and white. No text." },
    { seq: 3, kind: "dialogue", speaker: "izon-cast-preye", text: "Tari, bo dii! Ekine bo. Owu seki mụ.", roman: "TAH-ri, boh dee! eh-KEE-neh boh. OH-woo SEH-kee moo", translation: { en: "Tari, come and see! Ekine is coming. The water spirit will dance.", fr: "Tari, viens voir ! Ekine arrive. L'esprit de l'eau va danser." }, verify: true, startTime: 15, endTime: 22 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-tari", text: "Owu? Toru duo bomị?", roman: "OH-woo? TOH-roo doo-aw BOH-mee", translation: { en: "A water spirit? It comes from the river?", fr: "Un esprit de l'eau ? Il vient de la rivière ?" }, verify: true, startTime: 22, endTime: 27 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-preye", text: "Ee. Igbe titi, owu bo. Igbe faa, owu faa.", roman: "eh. EEG-beh TEE-tee, OH-woo boh. EEG-beh fah, OH-woo fah", translation: { en: "Yes. When the drum sounds, the spirit comes. No drum, no spirit.", fr: "Oui. Quand le tambour bat, l'esprit vient. Pas de tambour, pas d'esprit." }, source: "izon_master_dictionary.csv (titi = beat/hit; igbe = drum)", verify: true, startTime: 27, endTime: 34 },
    { seq: 6, kind: "sfx", text: "The great drum lands its first full pattern — the crowd answers." },
    { seq: 7, kind: "pause", text: "2s — let the drum breathe." },
    // Colour teaching beat.
    { seq: 8, kind: "screen", text: "Three cloth panels: red, white, black — labelled in Izon only." },
    { seq: 9, kind: "dialogue", speaker: "izon-cast-preye", text: "Dii ẹwiri. Mị kwa-kwa. Mị pena-pena. Mị dirimo.", roman: "dee eh-WEE-ree. mee kwah-kwah. mee PEH-na-PEH-na. mee dee-REE-mo", translation: { en: "Look at the colours. This is red. This is white. This is black.", fr: "Regarde les couleurs. Ceci est rouge. Ceci est blanc. Ceci est noir." }, verify: true, startTime: 40, endTime: 48 },
    { seq: 10, kind: "pause", text: "4s — learner echoes the three colours." },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-tari", text: "Bite kwa-kwa… ebi! Anị owu bite pena-pena.", roman: "BEE-teh kwah-kwah… EH-bee! AH-nee OH-woo BEE-teh PEH-na-PEH-na", translation: { en: "Red cloth… beautiful! That masquerade's cloth is white.", fr: "Pagne rouge… magnifique ! Le pagne de cette mascarade est blanc." }, verify: true, startTime: 48, endTime: 55 },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-preye", text: "Kwa-kwa — opu, pere-ama. Pena-pena — fie. Dirimo — toru buma, owu.", roman: "kwah-kwah — OH-poo, PEH-reh-ah-MAH. PEH-na-PEH-na — fee-eh. dee-REE-mo — TOH-roo BOO-ma, OH-woo", translation: { en: "Red — power, royalty. White — peace. Black — the deep water, the spirits.", fr: "Rouge — pouvoir, royauté. Blanc — paix. Noir — l'eau profonde, les esprits." }, verify: true, startTime: 55, endTime: 64 },
    { seq: 13, kind: "note", text: "Colour meanings are attested in cultural/izon.ts; the Izon phrasings here need a native pass (verify)." },
    { seq: 14, kind: "sfx", text: "Dance builds — bells on ankles, the drum doubles." },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Owu bo toru duo. Bo owei-bi seki. Beri — dii pere.", roman: "OH-woo boh TOH-roo doo-aw. boh OH-way-bee SEH-kee. BEH-ri — dee PEH-reh", translation: { en: "The spirit comes from the river. Come, the men dance. Quietly — just watch.", fr: "L'esprit vient de la rivière. Viens, les hommes dansent. En silence — regarde seulement." }, verify: true, startTime: 64, endTime: 72 },
    { seq: 16, kind: "pause", text: "3s." },
    // STORY — Ebiere on the Owuamapu / why the masquerade is danced.
    { seq: 17, kind: "screen", text: "Single illustration: a masked dancer mid-turn, cloth flaring, water behind. No text." },
    { seq: 18, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON STORY — 6–8 sentences on the Owuamapu: 'Long ago the water spirits lived close to us and taught us to fish and to read the creeks. When people fouled the water and forgot thanks, the spirits drew back into the deep. We dance the owu so they are not forgotten — so the water remembers us, and we remember the water.' — compose & record with a native speaker; heritage content.]]", translation: { en: "(Ebiere tells the Owuamapu tradition: the water spirits once lived close and taught the people to fish; when the water was fouled and thanks forgotten, they withdrew to the deep. The masquerade keeps the bond alive — so the water remembers the people, and the people the water.)", fr: "(Ebiere raconte la tradition des Owuamapu : les esprits de l'eau ont enseigné la pêche ; quand l'eau fut souillée, ils se retirèrent. La mascarade garde le lien vivant.)" }, verify: true, startTime: 72, endTime: 150 },
    { seq: 19, kind: "note", text: "Ties the environmental thread (I1: fewer fish) to cosmology (the spirits withdrawing). Heritage narration — native/cultural-authority pass required." },
    { seq: 20, kind: "sfx", text: "Drum resolves; crowd exhales; ambient fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-preye", direction: "Excited tour-guide energy; makes the colours vivid and quick." },
      { character: "izon-cast-tari", direction: "Wide-eyed; the awe is genuine; tries new describing sentences." },
      { character: "izon-cast-ebiere", direction: "Carries the closing heritage story; grave and beautiful." },
    ],
    soundDesign: [
      "Real Ekine drum patterns (source or commission from Ekine/Sekiapu musicians WITH permission and credit).",
      "Ankle bells, crowd call-and-response, waterfront bed.",
      "No synthetic music — the drum IS the music, and only between speech.",
    ],
    music: ["Traditional Ekine drumming ONLY, attributed; never bedded under speech."],
    visuals: [
      "Three colour panels (kwa-kwa/pena-pena/dirimo) with their meanings as icons, Izon labels only.",
      "Masquerade illustration for the story beat — no text.",
      "A subtle callback tint: the 'dark water' colour ties to Episode 4's creek.",
    ],
    notes: "Sacred specifics of Ekine are guarded — keep strictly to the public, celebratory layer. Attribute all drumming. Heritage story is a native-speaker placeholder.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/cultural/izon.ts (Ekine/Sekiapu, owu, igbe, seki; kwa-kwa/pena-pena/dirimo colour system; Owuamapu/Seigbein)",
    "userio-docs/izon_master_dictionary.csv (titi, dii, toru)",
    "web research: Ekine society, Owuamapu water-spirit tradition (Niger Delta)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// I3 — HOST-NARRATED (long) — "Ẹrẹ mọ Owei — A Union in the Compound"
// ─────────────────────────────────────────────────────────────────────────────
const I3: PodcastEpisode = {
  id: "izon-pod-i3",
  seriesId: SERIES,
  languageId: "izon",
  courseId: "course-izon-cm",
  order: 6,
  level: "intermediate",
  style: "host_narrated",
  length: "long",
  targetMinutes: 18,
  title: { en: "Episode 6 — A Union in the Compound", fr: "Épisode 6 — Une Union dans la Concession" },
  description: {
    en: "Preye's marriage is being arranged, and Tari sits in as two families meet — greetings in the formal register, the language of request and agreement, and the customs of the Izon marriage. Formal address, polite requests, and yes/no in ceremony.",
    fr: "Le mariage de Preye se prépare, et Tari assiste à la rencontre de deux familles — salutations en registre formel, langage de la demande et de l'accord, coutumes du mariage izon.",
  },
  logline: {
    en: "Two families, one table, and every word weighed. Tari watches a marriage begin.",
    fr: "Deux familles, une table, et chaque mot pesé. Tari observe le début d'un mariage.",
  },
  cefr: "B1",
  movementId: "mv_union",
  pillars: ["rites_of_passage", "kinship_belonging", "governance_values"],
  place: "compound",
  skills: ["listening", "speaking", "vocabulary", "grammar"],
  cast: ["izon-cast-tari", "izon-cast-ebiere", "izon-cast-preye", "izon-cast-amaokowei"],
  recycledFrom: ["izon-pod-b1", "izon-pod-b2"],
  newVocabTarget: 13,
  targetVocab: [
    { izon: "ere", roman: "EH-reh", gloss: { en: "wife / woman", fr: "épouse / femme" }, source: "izon_master_dictionary.csv (èré)" },
    { izon: "owei", roman: "OH-way", gloss: { en: "man / husband", fr: "homme / mari" }, source: "izon_master_dictionary.csv" },
    { izon: "yei", roman: "yay", gloss: { en: "husband", fr: "mari" }, source: "izon_master_dictionary.csv" },
    { izon: "fuo-owei", roman: "FOO-oh-OH-way", gloss: { en: "father-in-law", fr: "beau-père" }, source: "izon_master_dictionary.csv" },
    { izon: "warị", roman: "WAH-ri", gloss: { en: "house / family line", fr: "maison / lignée" }, source: "izon_master_dictionary.csv" },
    { izon: "otu", roman: "OH-too", gloss: { en: "group / people / family party", fr: "groupe / famille" }, source: "izon_master_dictionary.csv ('tị otu' = whose people)" },
    { izon: "pasisei / doo", roman: "pah-SEE-say / doh", gloss: { en: "please", fr: "s'il vous plaît" }, source: "mobile/lib/data/sentences/izon.ts" },
    { izon: "inyo / e", roman: "EEN-yo / eh", gloss: { en: "yes", fr: "oui" }, source: "izon_master_dictionary.csv" },
    { izon: "aghaịn", roman: "ah-GHINE", gloss: { en: "no", fr: "non" }, source: "izon_master_dictionary.csv (Aghaịn o)" },
    { izon: "pẹrị", roman: "PEH-ri", gloss: { en: "to want / ask for", fr: "vouloir / demander" }, verify: true },
    { izon: "kụrọ", roman: "KOO-ro", gloss: { en: "well / good health", fr: "bien / santé" }, source: "izon_master_dictionary.csv" },
    { izon: "okosu", roman: "oh-KOH-soo", gloss: { en: "elder", fr: "aîné" }, source: "izon_master_dictionary.csv" },
    { izon: "amata", roman: "ah-MAH-ta", gloss: { en: "a married woman", fr: "femme mariée" }, source: "Izon dictionary.pdf (amatá)" },
  ],
  grammarPoints: [
    {
      point: { en: "The formal/respect register", fr: "Le registre de respect" },
      explanation: {
        en: "Speaking to elders and in ceremony, requests are softened and expanded: not 'Bo' (come) but 'Sesei, … bo ee?' (Please, … will you come?); greetings gain the honorific 'E' and the person's title (Kịmịowei = Mr, Erearau = Mrs/Madam). Weight and indirectness signal respect.",
        fr: "Face aux aînés et en cérémonie, les demandes s'adoucissent : pas 'Bo' mais 'Sesei, … bo ee ?' ; les salutations prennent l'honorifique 'E' et le titre (Kịmịowei = M., Erearau = Mme).",
      },
      examples: [
        { izon: "E baịdẹ, Kịmịowei.", roman: "eh BY-deh, KEE-mee-OH-way", gloss: { en: "Good morning, sir.", fr: "Bonjour, monsieur." }, source: "izon_master_dictionary.csv" },
        { izon: "Sesei, bo ee?", roman: "SEH-say, boh eh", gloss: { en: "Please, will you come?", fr: "S'il vous plaît, viendrez-vous ?" }, source: "izon_master_dictionary.csv (Sesei…)", verify: true },
      ],
    },
    {
      point: { en: "Whose? — belonging in a marriage talk", fr: "À qui ? — l'appartenance dans un mariage" },
      explanation: {
        en: "'tị otu …?' = 'whose (which people's) …?'. Marriage joins otu to otu (family to family), so the talk is full of belonging: 'Mị tị otu ere?' — 'whose daughter is this?' The answer names the warị (house/line).",
        fr: "'tị otu …?' = 'à quelle famille … ?'. Le mariage unit otu à otu, la conversation est pleine d'appartenance.",
      },
      examples: [
        { izon: "Mị tị otu ere?", roman: "mee tee OH-too EH-reh", gloss: { en: "Whose daughter is she?", fr: "De quelle famille est-elle ?" }, verify: true },
      ],
    },
  ],
  culturalNotes: [
    {
      title: { en: "Marriage joins families, not just people", fr: "Le mariage unit des familles" },
      body: {
        en: "An Izon marriage is a negotiation and alliance between two warị (houses). Elders speak for each side; the couple is present but the register is communal and formal. There is a bride-price and a sequence of visits — terms and steps vary by clan (Kolokuma, Mein, Gbaramatu…), so specifics must be set by the family's own elders.",
        fr: "Un mariage izon est une alliance entre deux warị (maisons). Les aînés parlent pour chaque camp ; le couple est présent mais le registre est communautaire et formel. Les termes varient selon le clan.",
      },
      tags: ["naming_ceremonies", "rites_of_passage", "kinship"],
    },
    {
      title: { en: "'Sweet mouth' is a skill", fr: "La 'bouche douce' est un art" },
      body: {
        en: "Delta negotiation prizes eloquence and warmth — the same 'sweet mouth' that wins a market price wins a marriage suit. Bluntness offends; a request wrapped in greeting, proverb, and praise is a request that gets a yes.",
        fr: "La négociation du Delta valorise l'éloquence et la chaleur — la même 'bouche douce' qui gagne un prix au marché gagne une demande en mariage.",
      },
      tags: ["governance_values", "arts_oratory"],
    },
  ],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: a swept compound set for guests — benches, low voices, a kettle, chickens. Hold 18s." },
    { seq: 2, kind: "screen", text: "Illustration: two rows of chairs facing across a compound, kola and drinks on a stool. No text." },
    // Host-narration in Izon (Ebiere frames the scene).
    { seq: 3, kind: "narration", speaker: "izon-cast-ebiere", text: "Tọdẹ, otu mamụ bo. Preye ere mụ. Warị mọ warị mọ, kẹnị ye mụ.", roman: "TAW-deh, OH-too MAH-moo boh. PREH-yeh EH-reh moo. WAH-ri maw WAH-ri maw, KEH-nee yeh moo", translation: { en: "Today, two families come. Preye will marry. House and house will become one.", fr: "Aujourd'hui, deux familles viennent. Preye va se marier. Maison et maison deviendront une." }, verify: true, startTime: 18, endTime: 27 },
    { seq: 4, kind: "sfx", text: "The guest family arrives at the gate — greetings overlap." },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "E baịdẹ, warị otu! Ị kpọ nụa ee!", roman: "eh BY-deh, WAH-ri OH-too! ee kpaw NOO-ah eh", translation: { en: "Good morning, people of this house! You are all welcome!", fr: "Bonjour, gens de cette maison ! Soyez tous les bienvenus !" }, source: "izon_master_dictionary.csv (E baịdẹ; Ị kpọ nụa ee)", startTime: 27, endTime: 34 },
    { seq: 6, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Iyaa! Nụa, nụa. Peretimi, okosu-ama.", roman: "ee-YAH! NOO-ah, NOO-ah. peh-reh-TEE-mee, oh-KOH-soo-ah-MAH", translation: { en: "Welcome in return! Welcome, welcome. Be seated, elders.", fr: "Bienvenue à vous ! Bienvenue. Asseyez-vous, aînés." }, source: "izon_master_dictionary.csv (Iyaa!; peretimi = sit; okosu = elder)", verify: true, startTime: 34, endTime: 41 },
    { seq: 7, kind: "pause", text: "2s — settling." },
    { seq: 8, kind: "dialogue", speaker: "izon-cast-amaokowei", text: "Owo bo warị pẹrị. Owo enị ere pẹrị — Preye.", roman: "OH-wo boh WAH-ri PEH-ri. OH-wo EH-nee EH-reh PEH-ri — PREH-yeh", translation: { en: "We come to seek from this house. We ask for your daughter — Preye.", fr: "Nous venons faire une demande à cette maison. Nous demandons votre fille — Preye." }, verify: true, startTime: 41, endTime: 49 },
    { seq: 9, kind: "note", text: "The formal 'asking' — indirect, communal ('we ask'), naming the house before the person." },
    { seq: 10, kind: "dialogue", speaker: "izon-cast-tari", text: "(kala) Ebiere… mị tị otu owei?", roman: "(KAH-la) eh-bee-EH-reh… mee tee OH-too OH-way", translation: { en: "(quietly) Ebiere… whose son is he?", fr: "(doucement) Ebiere… de quelle famille est-il ?" }, verify: true, startTime: 49, endTime: 54 },
    { seq: 11, kind: "dialogue", speaker: "izon-cast-ebiere", text: "(kala) Beri, tụbọụ. Dii, nimi. Ọfọn pere seikẹ egberi tẹi-amị.", roman: "(KAH-la) BEH-ri, TOO-bow. dee, NEE-mee. AW-fawn PEH-reh SAY-keh eh-GBEH-ri TAY-ah-mee", translation: { en: "(quietly) Hush, child. Watch, learn. Words alone do not tie a bundle.", fr: "(doucement) Chut, mon enfant. Regarde, apprends. Les paroles seules ne lient pas le fagot." }, literal: "words only SUBJ bundle tie-NEG", source: "mobile/lib/data/proverbs/izon.ts (pv-iz-4)", verify: true, startTime: 54, endTime: 63 },
    { seq: 12, kind: "note", text: "Ebiere teaches Tari with a proverb — 'talk is cheap; the ceremony (and the bride-price) is the real bond.'" },
    { seq: 13, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Preye enị ere. Kụrọ ere, fịmọ ere. Owo… e, owo inyo gba.", roman: "PREH-yeh EH-nee EH-reh. KOO-ro EH-reh, FEE-maw EH-reh. OH-wo… eh, OH-wo EEN-yo gbah", translation: { en: "Preye is our daughter. A good woman, a hard-working woman. We… yes, we say yes.", fr: "Preye est notre fille. Une bonne femme, une femme travailleuse. Nous… oui, nous disons oui." }, verify: true, startTime: 63, endTime: 72 },
    { seq: 14, kind: "sfx", text: "Approval ripples — ululation, laughter, hands clapping once in unison." },
    { seq: 15, kind: "dialogue", speaker: "izon-cast-preye", text: "Ụmbana, okosu-ama. Doo, doo!", roman: "oom-BAH-na, oh-KOH-soo-ah-MAH. doh, doh", translation: { en: "Thank you, elders. Thank you, thank you!", fr: "Merci, les aînés. Merci, merci !" }, startTime: 72, endTime: 77 },
    { seq: 16, kind: "pause", text: "3s." },
    // Register drill — informal vs formal command/greeting pairs.
    { seq: 17, kind: "screen", text: "Two-column card: informal ↔ formal. Same content, different weight." },
    { seq: 18, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Bo. → Sesei, bo ee. / Baidẹ. → E baịdẹ, Kịmịowei.", roman: "boh → SEH-say, boh eh / BY-deh → eh BY-deh, KEE-mee-OH-way", translation: { en: "Come. → Please, will you come. / Morning. → Good morning, sir.", fr: "Viens. → S'il te plaît, viendras-tu. / Bonjour. → Bonjour, monsieur." }, verify: true, startTime: 80, endTime: 88 },
    { seq: 19, kind: "pause", text: "4s each — learner produces the formal version." },
    // STORY — Ebiere on what a marriage really binds (extended input).
    { seq: 20, kind: "screen", text: "Single illustration: two clasped hands over a bowl of kola. No text." },
    { seq: 21, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON STORY — 6–8 sentences: 'A marriage is not two young people liking each other. It is my house and their house agreeing to share children, to share trouble, to sit together at every burial and every naming from now on. The bride-price is not a purchase — it is a knot, tied so the two houses cannot easily walk away from one another. That is why we send elders, not lovers, to do the talking.' — compose & record with a native speaker; customs vary by clan.]]", translation: { en: "(Ebiere: a marriage is two houses agreeing to share children and troubles and to sit together at every future rite; the bride-price is a knot, not a purchase — which is why elders, not lovers, do the talking.)", fr: "(Ebiere : un mariage, c'est deux maisons qui acceptent de partager enfants et épreuves ; la dot est un nœud, non un achat — d'où le rôle des aînés.)" }, verify: true, startTime: 91, endTime: 170 },
    { seq: 22, kind: "note", text: "Bride-price and step-sequence differ by clan (Kolokuma/Mein/Gbaramatu). Keep the story about MEANING, not a specific tariff; a family's own elders set particulars." },
    { seq: 23, kind: "sfx", text: "Celebration rises — drum, voices — and fades to silence." },
  ],
  production: {
    voices: [
      { character: "izon-cast-amaokowei", direction: "Formal, resonant, ceremonial — the visiting family's spokesman here." },
      { character: "izon-cast-ebiere", direction: "Host and narrator; matriarch answering for her house; teaches Tari in whispers." },
      { character: "izon-cast-preye", direction: "For once, quiet and moved — the teaser is on the receiving end of ceremony." },
      { character: "izon-cast-tari", direction: "Whispered asides to Ebiere = the learner's own questions voiced." },
    ],
    soundDesign: [
      "Compound-set-for-guests bed; kola bowl, benches, kettle.",
      "Communal reactions: ululation, unison clap, laughter — the 'yes' is a sound event.",
      "Closing celebration drum (attributed), only between speech.",
    ],
    music: ["Traditional celebratory drumming at the close only; never under speech."],
    visuals: [
      "Formal-register two-column card (informal ↔ formal).",
      "'Whose house?' family-tree chips as the otu are named.",
      "Story beat: clasped hands over kola — no text.",
    ],
    notes: "Longest intermediate episode. The 'host' is Ebiere narrating in Izon. Marriage particulars are deliberately left to family elders; the episode teaches register and meaning, not a bride-price tariff.",
  },
  audioUrl: null,
  isActive: false,
  sources: [
    "userio-docs/izon_master_dictionary.csv (E baịdẹ, Ị kpọ nụa ee, Iyaa, peretimi, okosu, fuo-owei, otu, Sesei, inyo/aghaịn, Kịmịowei/Erearau titles)",
    "mobile/lib/data/proverbs/izon.ts (pv-iz-4 'words alone do not tie a bundle')",
    "userio-docs/Izon dictionary.pdf (amatá = circumcised/married woman)",
  ],
};

export const IZON_PODCAST_INTERMEDIATE: PodcastEpisode[] = [I1, I2, I3];
