/**
 * "Bou Mie" — FILMS (Izon reference mini-series)
 * ----------------------------------------------
 * Three films in the same world as the podcast "The Long Way Home". They share a
 * `seriesId` (the mini-series grouping) and each carries its own interactive
 * `storyId` so it opens as a playable branching story; the series screen surfaces
 * them together in its "Also in this world" rail.
 *   F1  izon-film-creeks     · DOCUMENTARY     ~8m  — the creeks & the thinning catch
 *   F2  izon-film-emptynet   · NARRATIVE SHORT ~12m — Tari, Timi & Uncle Ere, one bad day
 *   F3  izon-film-woyengi    · HERITAGE FILM   ~10m — the Woyengi creation story, retold
 *
 * F2 uses the podcast cast directly and pays off the season's environmental
 * thread; F3 dramatises the tale Ebiere tells in podcast Episode 8. All three
 * are isActive:false pending native-speaker recording; heritage speech is a
 * [[bracketed placeholder]] to be sourced from a verified keeper.
 *
 * Corpus discipline identical to the podcast files (see ../README.md).
 */

import type { FilmItem } from "../film-types";

const FILM_SERIES = "izon-boumie-films";

// ─────────────────────────────────────────────────────────────────────────────
// F1 — DOCUMENTARY (short) — "Toru Angọ — The Creeks Remember"
// ─────────────────────────────────────────────────────────────────────────────
const F1: FilmItem = {
  id: "izon-film-creeks",
  seriesId: FILM_SERIES,
  languageId: "izon",
  kind: "documentary",
  title: { en: "The Creeks Remember", fr: "Les Ruisseaux se Souviennent" },
  logline: {
    en: "The water taught the Izon to live. Now the water is changing — and the elders are listening.",
    fr: "L'eau a appris aux Izon à vivre. Aujourd'hui l'eau change — et les aînés écoutent.",
  },
  synopsis: {
    en: "An observational short: dawn on a Bayelsa creek, a fisherman reading the water, and an elder's reflection on the Owuamapu — the water spirits who taught the people to fish and withdrew when the rivers were fouled. A quiet documentary on livelihood, memory, and a changing Delta.",
    fr: "Un court métrage d'observation : l'aube sur un ruisseau de Bayelsa, un pêcheur qui lit l'eau, et la réflexion d'un aîné sur les Owuamapu — les esprits de l'eau qui enseignèrent la pêche et se retirèrent quand les rivières furent souillées.",
  },
  body: {
    en: "Filmed at the water's edge, 'The Creeks Remember' sits with the rhythm of a fishing morning and lets the place speak. Narration is by Uncle Ere; there is no interpreter and no interface-language voice — meaning is carried by image, subtitle, and the water itself. The film grounds the environmental thread that runs through the whole Bou Mie world: fewer fish, an elder's worry, and the belief that the river remembers how it is treated. Pairs with podcast Episode 4 (Down to the River) and Episode 5 (the Ekine masquerade).",
    fr: "Tourné au bord de l'eau, ce film épouse le rythme d'un matin de pêche et laisse parler le lieu. La narration est d'Oncle Ere ; ni interprète ni voix en langue d'interface. Il ancre le fil écologique de tout l'univers Bou Mie.",
  },
  showNotes: {
    en: "Narrator: Uncle Ere. Glossary: toru (river), bou (creek), endi (fish), neti (net), owuamapu (water spirits), toru angọ (the river's source). The proverb 'Toru angọ kụlụ bogha' — the river does not forget its source — anchors the film. Attribution: any traditional water-song used must be credited to its community source.",
    fr: "Narrateur : Oncle Ere. Glossaire : toru, bou, endi, neti, owuamapu, toru angọ. Le proverbe 'Toru angọ kụlụ bogha' ancre le film.",
  },
  author: "Beeli · community documentary",
  runtimeMinutes: 8,
  publishedAt: "2026-07-01T00:00:00Z",
  featured: true,
  storyId: "izon-creeks",
  coverEmoji: "🌊",
  coverGradient: ["#0E3A46", "#123B2E"],
  cast: ["izon-cast-ere"],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: pre-dawn creek, paddle dips, one bird, water off wood. Hold 20s under titles." },
    { seq: 2, kind: "screen", text: "Title card, Izon only: 'Toru Angọ'. Slow push-in on black water at first light." },
    { seq: 3, kind: "narration", speaker: "izon-cast-ere", text: "Toru. Owo fiye. Owo daubọ fiye kpo.", roman: "TOH-roo. OH-wo fee-yeh. OH-wo DAH-oo-baw fee-yeh kpo", translation: { en: "The river. Our life. The life of our ancestors too.", fr: "La rivière. Notre vie. La vie de nos ancêtres aussi." }, verify: true, startTime: 20, endTime: 27 },
    { seq: 4, kind: "chapter", text: "I. The Morning" },
    { seq: 5, kind: "sfx", text: "Net cast — a soft spreading splash. Long real silence. One bird." },
    { seq: 6, kind: "narration", speaker: "izon-cast-ere", text: "Beke ye, endi opu emi. Tọdẹ… endi pẹrị pẹrị.", roman: "BEH-keh yeh, EN-dee OH-poo EH-mee. TAW-deh… EN-dee PEH-ri PEH-ri", translation: { en: "In the old days, there were big fish. Today… little, little fish.", fr: "Autrefois, il y avait de gros poissons. Aujourd'hui… peu, peu de poissons." }, verify: true, startTime: 40, endTime: 48 },
    { seq: 7, kind: "narration", speaker: "izon-cast-ere", text: "Beni dirimo. Endi mu. Angọ nimi.", roman: "BEH-nee dee-REE-mo. EN-dee moo. AN-gaw NEE-mee", translation: { en: "The water is dark. The fish have gone. The source knows why.", fr: "L'eau est sombre. Les poissons sont partis. La source sait pourquoi." }, verify: true, startTime: 48, endTime: 55 },
    { seq: 8, kind: "chapter", text: "II. The Spirits of the Water" },
    { seq: 9, kind: "screen", text: "Archival-style stills / illustration: an Ekine masquerade, then empty deep water. No text." },
    { seq: 10, kind: "narration", speaker: "izon-cast-ere", text: "[[IZON NARRATION — 5–6 sentences on the Owuamapu: the water spirits lived close, taught us to fish and read the creeks; when people fouled the water and forgot thanks, they drew into the deep. — source from a verified keeper; do not fabricate.]]", translation: { en: "(Ere recounts the Owuamapu tradition: the water spirits once lived close and taught the people to fish; when the water was fouled and thanks forgotten, they withdrew to the deep.)", fr: "(Ere raconte la tradition des Owuamapu : les esprits de l'eau enseignèrent la pêche puis se retirèrent quand l'eau fut souillée.)" }, verify: true, startTime: 70, endTime: 130 },
    { seq: 11, kind: "chapter", text: "III. The River's Memory" },
    { seq: 12, kind: "narration", speaker: "izon-cast-ere", text: "Toru angọ kụlụ bogha.", roman: "TOH-roo AN-gaw KOO-loo BOH-gha", translation: { en: "The river does not forget its source.", fr: "La rivière n'oublie pas sa source." }, literal: "river source forget NEG", source: "mobile/lib/data/proverbs/izon.ts (pv-iz-16)", startTime: 145, endTime: 151 },
    { seq: 13, kind: "note", text: "Hold the proverb over the final image; it is the film's thesis — the water keeps account of how it is treated." },
    { seq: 14, kind: "sfx", text: "Water rises, then cuts to silence on a black frame." },
  ],
  culturalNotes: [
    {
      title: { en: "A Delta under strain", fr: "Un Delta sous pression" },
      body: {
        en: "Oil extraction, spills, and overfishing have thinned the Niger Delta's catch within living memory. Elders track the change as lived history, not statistics. The film keeps this at eye level — one fisherman, one morning — rather than as a lecture.",
        fr: "L'extraction pétrolière, les déversements et la surpêche ont réduit les prises du delta du Niger en une génération. Les aînés suivent ce changement comme une histoire vécue.",
      },
      tags: ["environment", "land_livelihood"],
    },
  ],
  production: {
    voices: [
      { character: "izon-cast-ere", direction: "Documentary narration, spare and weathered; long pauses; let the silence and water breathe." },
    ],
    soundDesign: [
      "Signature near-silence; the creek is the score.",
      "Net-cast foley; the disappointing small catch left unremarked.",
      "No music bed; optional single traditional water-song fragment, attributed, between chapters only.",
    ],
    music: ["None under narration; one credited traditional water-song fragment allowed at a chapter break."],
    visuals: [
      "Chapter cards in Izon only (I / II / III).",
      "Verité imagery: hands, net, water surface; illustration/archival stills for the Owuamapu passage.",
      "Final frame holds the proverb 'Toru angọ kụlụ bogha' in Izon.",
    ],
    notes: "Documentary register. The Owuamapu passage is heritage narration — source from a keeper before recording.",
  },
  audioUrl: null,
  videoUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/cultural/izon.ts (Owuamapu/Seigbein; owu)",
    "mobile/lib/data/proverbs/izon.ts (pv-iz-16 'the river does not forget its source')",
    "userio-docs/izon_master_dictionary.csv (toru, endi, beni, neti, opu/pẹrị, daubọ)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// F2 — NARRATIVE SHORT (medium) — "Neti Yefaa — The Empty Net"
// ─────────────────────────────────────────────────────────────────────────────
const F2: FilmItem = {
  id: "izon-film-emptynet",
  seriesId: FILM_SERIES,
  languageId: "izon",
  kind: "narrative_short",
  title: { en: "The Empty Net", fr: "Le Filet Vide" },
  logline: {
    en: "Timi swore the catch would be big. The net comes up empty. What a family does next is the real lesson.",
    fr: "Timi avait juré une grosse prise. Le filet remonte vide. Ce que fait alors une famille, voilà la vraie leçon.",
  },
  synopsis: {
    en: "A narrative short with the Bou Mie cast. Timi talks Tari into a dawn fishing run he promises will be huge; Uncle Ere warns them off the polluted channel; they go anyway, and the net comes up empty. Back at the compound, shame turns to something better as Ebiere reframes the failure with a proverb. A small, warm story about pride, the changing creeks, and belonging.",
    fr: "Un court métrage narratif avec la distribution de Bou Mie. Timi entraîne Tari dans une pêche à l'aube qu'il promet énorme ; Oncle Ere les met en garde ; ils y vont quand même, et le filet remonte vide. À la concession, la honte se mue en autre chose grâce à un proverbe d'Ebiere.",
  },
  body: {
    en: "Set between podcast Episodes 4 and 7, 'The Empty Net' dramatises the season's environmental thread as personal stakes: Timi's boast, Tari's trust, Ere's unheeded warning, and Ebiere's gentle correction. All dialogue is Izon; the story is legible from action and image. It reuses and extends the river vocabulary and the unity/canoe proverbs from the courses and podcast, so a learner meets the same words in a new frame.",
    fr: "Situé entre les épisodes 4 et 7 du podcast, 'Le Filet Vide' met en scène le fil écologique comme enjeu personnel. Tous les dialogues sont en izon ; l'histoire se lit par l'action et l'image.",
  },
  showNotes: {
    en: "Cast: Timi, Tari, Uncle Ere, Ebiere. Reuses river vocabulary (yọụ, neti, endi, faa) and the proverb 'Ọkọ kẹnị bẹ ama toru firigha-amị' (one canoe cannot cross the river alone). Glossary and full transcript in-app.",
    fr: "Distribution : Timi, Tari, Oncle Ere, Ebiere. Réemploie le vocabulaire de la rivière et le proverbe 'une seule pirogue ne traverse pas la rivière'.",
  },
  author: "Beeli · community narrative",
  runtimeMinutes: 12,
  publishedAt: "2026-07-01T00:00:00Z",
  featured: true,
  storyId: "izon-empty-net",
  coverEmoji: "🎣",
  coverGradient: ["#123B2E", "#C4862A"],
  cast: ["izon-cast-timi", "izon-cast-tari", "izon-cast-ere", "izon-cast-ebiere"],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: pre-dawn compound → creek. Paddle, mist. Hold 12s." },
    { seq: 2, kind: "screen", text: "Title: 'Neti Yefaa'. Two figures loading a canoe in the dark. No subtitle yet." },
    { seq: 3, kind: "dialogue", speaker: "izon-cast-timi", text: "Tari, bo! Tọdẹ, endi opu! Emịnị nimi.", roman: "TAH-ri, boh! TAW-deh, EN-dee OH-poo! eh-MEE-nee NEE-mee", translation: { en: "Tari, come! Today, big fish! I know it.", fr: "Tari, viens ! Aujourd'hui, du gros poisson ! Je le sais." }, verify: true, startTime: 12, endTime: 19 },
    { seq: 4, kind: "dialogue", speaker: "izon-cast-ere", text: "Bou anị mu-daị. Beni dirimo. Endi faa.", roman: "boh AH-nee moo-DYE. BEH-nee dee-REE-mo. EN-dee fah", translation: { en: "Don't go to that creek. The water is dark. No fish there.", fr: "N'allez pas à ce ruisseau. L'eau est sombre. Pas de poisson là-bas." }, verify: true, startTime: 19, endTime: 26 },
    { seq: 5, kind: "dialogue", speaker: "izon-cast-timi", text: "Uncle, ese faa! Emịnị nimi bou. Bo, Tari!", roman: "OON-kul, EH-seh fah! eh-MEE-nee NEE-mee boh. boh, TAH-ri", translation: { en: "Uncle, no problem! I know the creek. Come, Tari!", fr: "Oncle, pas de souci ! Je connais le ruisseau. Viens, Tari !" }, source: "sentences/izon.ts (ese faa = no problem)", verify: true, startTime: 26, endTime: 33 },
    { seq: 6, kind: "note", text: "The warning ignored — the pride that the film will humble. Ere watches them go, says nothing more." },
    { seq: 7, kind: "chapter", text: "The Dark Creek" },
    { seq: 8, kind: "sfx", text: "Paddling into stiller, darker water; birdsong thins to nothing; an oily sheen sound-designed as silence." },
    { seq: 9, kind: "dialogue", speaker: "izon-cast-tari", text: "Timi… beni fie-a fa. Endi emii?", roman: "TEE-mee… BEH-nee fee-eh-ah fah. EN-dee eh-MEE", translation: { en: "Timi… the water is not calm/clean. Is there any fish?", fr: "Timi… l'eau n'est pas pure. Y a-t-il du poisson ?" }, verify: true, startTime: 45, endTime: 52 },
    { seq: 10, kind: "dialogue", speaker: "izon-cast-timi", text: "Beri. Neti tụ. … Kọn! Kọn!", roman: "BEH-ri. NEH-tee too. … kawn! kawn", translation: { en: "Quiet. Throw the net. … Pull! Pull!", fr: "Silence. Jette le filet. … Tire ! Tire !" }, verify: true, startTime: 52, endTime: 59 },
    { seq: 11, kind: "sfx", text: "Net hauled — the wet, heavy sound of NOTHING. Water draining through empty mesh." },
    { seq: 12, kind: "dialogue", speaker: "izon-cast-timi", text: "…Neti yefaa. Endi faa. Kẹnị kpo faa.", roman: "…NEH-tee yeh-FAH. EN-dee fah. KEH-nee kpo fah", translation: { en: "…The net is empty. No fish. Not even one.", fr: "…Le filet est vide. Pas de poisson. Pas même un." }, verify: true, startTime: 62, endTime: 69 },
    { seq: 13, kind: "note", text: "The film's turn. No shouting; the empty net does the work. Silence between the cousins on the paddle home." },
    { seq: 14, kind: "chapter", text: "Home" },
    { seq: 15, kind: "sfx", text: "Compound, mid-morning. The two arrive with an empty canoe. Ebiere waiting." },
    { seq: 16, kind: "dialogue", speaker: "izon-cast-tari", text: "Ebiere… neti yefaa. Owo endi kọngha.", roman: "eh-bee-EH-reh… NEH-tee yeh-FAH. OH-wo EN-dee kawn-gha", translation: { en: "Ebiere… the net is empty. We caught no fish.", fr: "Ebiere… le filet est vide. Nous n'avons rien pris." }, verify: true, startTime: 80, endTime: 87 },
    { seq: 17, kind: "dialogue", speaker: "izon-cast-ebiere", text: "Dii tụbọụ. Endi faa, duọ owo mamụ emi. Ọkọ kẹnị bẹ ama toru firigha-amị.", roman: "dee TOO-bow. EN-dee fah, doo-aw OH-wo MAH-moo EH-mee. AW-kaw KEH-nee beh ah-MAH TOH-roo fee-REE-gha ah-MEE", translation: { en: "Look, child. No fish — but the two of you came back together. One canoe cannot cross the river alone.", fr: "Regarde, mon enfant. Pas de poisson — mais vous êtes revenus ensemble. Une seule pirogue ne traverse pas la rivière seule." }, literal: "…canoe one NEG town river cross-NEG", source: "proverbs/izon.ts (pv-iz-1)", verify: true, startTime: 87, endTime: 98 },
    { seq: 18, kind: "note", text: "Ebiere reframes failure as belonging: the catch failed, the family held. The proverb closes it — commemoration, not comfort (per her character)." },
    { seq: 19, kind: "dialogue", speaker: "izon-cast-ere", text: "(kala) Amịnị nimi bou. Duọ… amịnị bọ eye kọndẹ.", roman: "(KAH-la) ah-MEE-nee NEE-mee boh. doo-aw… ah-MEE-nee baw EH-yeh KAWN-deh", translation: { en: "(quietly) He knows the creek. But — now he has learned his lesson.", fr: "(doucement) Il connaît le ruisseau. Mais — il a appris sa leçon." }, verify: true, startTime: 98, endTime: 106 },
    { seq: 20, kind: "sfx", text: "Compound life resumes; a small shared laugh; fade to the empty net drying on a line." },
  ],
  culturalNotes: [
    {
      title: { en: "Boasting and the catch", fr: "La vantardise et la prise" },
      body: {
        en: "A fisher's confidence is cultural currency, but the creeks now humble it. The film lets Timi's boast collide with a polluted channel — a real Delta hazard — and resolves not in blame but in the value the community actually prizes: coming home together.",
        fr: "L'assurance du pêcheur est une monnaie culturelle, mais les ruisseaux la rabaissent désormais. Le film résout non par le blâme mais par ce que la communauté valorise : rentrer ensemble.",
      },
      tags: ["land_livelihood", "governance_values", "environment"],
    },
  ],
  production: {
    voices: [
      { character: "izon-cast-timi", direction: "Cocky at dawn, deflated at the net; the arc is in the voice." },
      { character: "izon-cast-tari", direction: "Trusting, then quietly alarmed; the audience's eyes." },
      { character: "izon-cast-ere", direction: "One warning, unheeded; one soft word at the end. That's all." },
      { character: "izon-cast-ebiere", direction: "The reframing proverb — warm authority, no scolding." },
    ],
    soundDesign: [
      "Contrast beds: living creek (birds) → dead channel (sound-designed silence, faint sheen).",
      "The empty-net haul: heavy, wet, and yielding nothing — the film's key sound.",
      "Compound warmth to close.",
    ],
    music: ["None under dialogue; optional soft goje motif over the final drying-net image only."],
    visuals: [
      "Chapter cards in Izon.",
      "The oily sheen / dark water is the visual antagonist.",
      "Closing image: the empty net on a line — subtitle holds the proverb.",
    ],
    notes: "Narrative short using the podcast cast; slots between podcast Eps 4 and 7. Dialogue verify-flagged for native pass; no heritage placeholders here beyond none required.",
  },
  audioUrl: null,
  videoUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/proverbs/izon.ts (pv-iz-1 'one canoe cannot cross the river alone')",
    "mobile/lib/data/sentences/izon.ts (ese faa = no problem)",
    "userio-docs/izon_master_dictionary.csv (yọụ, neti, endi, faa, kọn, beni, dirimo, bou)",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// F3 — HERITAGE FILM (short) — "Woyengi — The Mother of Choosing"
// ─────────────────────────────────────────────────────────────────────────────
const F3: FilmItem = {
  id: "izon-film-woyengi",
  seriesId: FILM_SERIES,
  languageId: "izon",
  kind: "heritage",
  title: { en: "Woyengi — The Mother of Choosing", fr: "Woyengi — La Mère du Choix" },
  logline: {
    en: "Before there were people, there was the Mother, the clay, and the choosing.",
    fr: "Avant les hommes, il y avait la Mère, l'argile et le choix.",
  },
  synopsis: {
    en: "A heritage film retelling the Izon creation story — the same tale Ebiere gives Tari by lamplight in podcast Episode 8. Woyengi, Our Mother, descends on lightning to Oporoma, moulds humankind from earth, and lets each person choose their destiny before birth. Told in Izon with illustrated animation, it is the cosmological cornerstone of the whole Bou Mie world.",
    fr: "Un film patrimonial qui retrace l'histoire de la création izon — le récit qu'Ebiere confie à Tari à l'épisode 8 du podcast. Woyengi descend sur la foudre à Oporoma, façonne l'humanité dans la terre et laisse chacun choisir son destin avant la naissance.",
  },
  body: {
    en: "The heritage centrepiece of the mini-series. Woyengi ('Our Mother') is the Izon creator: she sits on the creation chair, moulds each person from clay, breathes in life, and — uniquely — lets each choose gender, gifts, and the manner of their life and death. Fate and free will are tied together. The narration MUST be recorded verbatim from a verified Izon keeper; the script here is scaffold only. Watch alongside podcast Episode 8 (which teaches the narrative past used to tell it) and the finale's libation.",
    fr: "La pièce maîtresse patrimoniale de la mini-série. La narration DOIT être enregistrée mot pour mot auprès d'un gardien izon vérifié ; le script ici n'est qu'une trame.",
  },
  showNotes: {
    en: "HERITAGE — narration to be sourced verbatim from a verified Izon keeper and credited. Glossary: Woyengi (creator mother), ebi (clay/earth), fiyowei (life/breath), ereibi (creation chair), ogbo (destiny), daubọ (ancestors). Optional extension: the Ogboinba tragedy (she who tried to un-choose her fate). Told only after dark, per custom.",
    fr: "PATRIMOINE — narration à sourcer mot pour mot auprès d'un gardien izon vérifié et à créditer. Glossaire : Woyengi, ebi, fiyowei, ereibi, ogbo, daubọ.",
  },
  author: "Beeli · with a community keeper (to be credited)",
  runtimeMinutes: 10,
  publishedAt: "2026-07-01T00:00:00Z",
  featured: true,
  storyId: "izon-woyengi",
  coverEmoji: "🌟",
  coverGradient: ["#2A2531", "#C4862A"],
  cast: ["izon-cast-ebiere"],
  script: [
    { seq: 1, kind: "sfx", text: "Ambient: night, distant thunder, a low fire. Hold 15s under the title." },
    { seq: 2, kind: "screen", text: "Title in Izon: 'Woyengi'. A single point of light in darkness that resolves into lightning." },
    { seq: 3, kind: "narration", speaker: "izon-cast-ebiere", text: "Dein-a egberi gbagha. Agụra gba. Beke ye…", roman: "DAYN-ah eh-GBEH-ri GBAH-gha. ah-GOO-ra gbah. BEH-keh yeh", translation: { en: "We do not tell tales by day. Only at night. Long ago…", fr: "On ne conte pas le jour. Seulement la nuit. Il y a longtemps…" }, verify: true, startTime: 15, endTime: 23 },
    { seq: 4, kind: "chapter", text: "I. The Descent" },
    { seq: 5, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON CREATION NARRATIVE — Part 1 (~6 sentences): Woyengi, Our Mother, comes down on the lightning to Oporoma and sets up her creation chair (ereibi). — source verbatim from a verified keeper.]]", translation: { en: "(Part 1 — Woyengi, Our Mother, descends on lightning to Oporoma and sets up her creation chair.)", fr: "(Partie 1 — Woyengi, Notre Mère, descend sur la foudre à Oporoma et installe son trône de création.)" }, verify: true, startTime: 25, endTime: 75 },
    { seq: 6, kind: "chapter", text: "II. The Clay" },
    { seq: 7, kind: "screen", text: "Illustrated animation: hands shaping figures from earth; breath entering them." },
    { seq: 8, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON CREATION NARRATIVE — Part 2 (~6 sentences): she takes the earth (ebi), moulds the human beings, breathes life (fiyowei) into them. — verified keeper source required.]]", translation: { en: "(Part 2 — she takes the earth, moulds human beings and breathes life into them.)", fr: "(Partie 2 — elle prend la terre, façonne les humains et leur insuffle la vie.)" }, verify: true, startTime: 76, endTime: 128 },
    { seq: 9, kind: "chapter", text: "III. The Choosing" },
    { seq: 10, kind: "narration", speaker: "izon-cast-ebiere", text: "[[IZON CREATION NARRATIVE — Part 3 (~6 sentences): each person chooses gender, fortune, and the manner of their life and death (ogbo, destiny); then they go to earth by water and by land. — verified keeper source required.]]", translation: { en: "(Part 3 — each person chooses gender, fortune, and the manner of their life and death, then goes to earth by water and by land.)", fr: "(Partie 3 — chacun choisit son genre, sa fortune, sa vie et sa mort, puis gagne la terre par l'eau et par la terre.)" }, verify: true, startTime: 129, endTime: 185 },
    { seq: 11, kind: "narration", speaker: "izon-cast-ebiere", text: "Enị ogbo, ị pẹrịmị. Kịmị fụọ, ogbo fụọ.", roman: "EH-nee OG-bo, ee PEH-ri-mee. KEE-mee FOO-aw, OG-bo FOO-aw", translation: { en: "Your destiny, you yourself chose it. Every person, their own fate.", fr: "Ton destin, c'est toi qui l'as choisi. Chaque personne, son propre sort." }, verify: true, startTime: 186, endTime: 194 },
    { seq: 12, kind: "note", text: "Optional coda: the Ogboinba tragedy, only if a keeper provides it. Close on the fire and the last of the thunder." },
    { seq: 13, kind: "sfx", text: "Thunder recedes; fire settles; fade to black." },
  ],
  culturalNotes: [
    {
      title: { en: "Woyengi and the ethics of destiny", fr: "Woyengi et l'éthique du destin" },
      body: {
        en: "That each soul chooses its own path before birth ties fate and responsibility together in Izon thought: your life is, in a deep sense, your own choice. The famous sequel — Ogboinba, who journeys to un-choose her barrenness and fails — is the tale's tragic mirror. This is sacred narrative: source it, credit it, and never invent it.",
        fr: "Que chaque âme choisisse son chemin avant la naissance lie destin et responsabilité dans la pensée izon. La suite célèbre — Ogboinba — en est le miroir tragique. Récit sacré : à sourcer, créditer, jamais inventer.",
      },
      tags: ["creation_myths", "cosmology"],
    },
    {
      title: { en: "Night, and the rule of telling", fr: "La nuit et la règle du conte" },
      body: {
        en: "Folktales are told only after dark; daytime telling is said to bring misfortune. The film honours this by framing itself as a night-telling — the same frame Ebiere uses in podcast Episode 8.",
        fr: "Les contes ne se disent qu'après la tombée de la nuit. Le film respecte cette règle en se présentant comme un récit nocturne.",
      },
      tags: ["oral_tradition", "arts_oratory"],
    },
  ],
  production: {
    voices: [
      { character: "izon-cast-ebiere", direction: "Master teller. The night-telling frame; slightly slower than speech; let thunder and silence carry weight. Record the tale from a keeper — do not perform a fabricated text." },
    ],
    soundDesign: [
      "Intimate night bed: fire, far thunder tied to Woyengi's lightning.",
      "No music; the voice, fire, and thunder are the whole score.",
    ],
    music: ["None; optional single credited traditional refrain at the very end."],
    visuals: [
      "Illustrated animation, not live action: lightning descent → creation chair → clay figures → the two paths (water & land).",
      "Chapter cards in Izon (I / II / III).",
      "Written Izon of the closing line appears for reading.",
    ],
    notes: "HERITAGE FILM. The narrative is bracketed scaffold — the final text MUST come verbatim from a verified Izon keeper, with credit. isActive stays false until sourced.",
  },
  audioUrl: null,
  videoUrl: null,
  isActive: false,
  sources: [
    "mobile/lib/data/cultural/izon.ts (Woyengi: Oporoma, creation chair, clay, chosen destiny; ebi/fiyowei/ogbo/ereibi/daubọ)",
    "cross-ref: podcast Episode 8 (izon-pod-a2) — same tale, teaches the narrative past",
    "HERITAGE: creation narrative to be sourced verbatim from a verified Izon keeper (+ optional Ogboinba)",
  ],
};

export const IZON_FILMS: FilmItem[] = [F1, F2, F3];
