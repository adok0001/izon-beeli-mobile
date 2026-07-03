/**
 * "The Long Way Home" — recurring cast (Izon reference series)
 * ------------------------------------------------------------
 * Bou Mie — "coming to the creek" — is the Izon reference implementation of the
 * Beeli podcast format. The cast below is the reusable archetype set: a
 * returnee-learner, a keeper-elder, a peer, a livelihood figure, a trader, and
 * a ceremonial authority. Another language copies these ARCHETYPES and renames
 * them for its own culture (see ../CONTRIBUTOR-GUIDE.md).
 *
 * Names are drawn from real Izon usage already present in this codebase
 * (mobile/lib/data/lessons/izon-first-words.ts, stories/izon-basics.ts,
 * lessons/izon-numbers-trade.ts) so the podcast reuses an established world:
 * Ebiere, Tari, Preye (Pịrịye), Timi, Isampou, Kolokuma, Yenagoa are all
 * attested there. Roles map to the design-course Izon culture pack cast.
 */

import type { PodcastCharacter } from "../podcast-types";

export const IZON_CAST: PodcastCharacter[] = [
  {
    id: "izon-cast-tari",
    name: "Tari",
    role: "The Returnee — the learner's surrogate",
    persona:
      "~25, grew up in Yenagoa/Port Harcourt speaking mostly English and Pidgin; understands scraps of Izon but is shy to speak. Warm, eager, self-deprecating, makes real beginner mistakes.",
    relationships:
      "Grandson/granddaughter of Ebiere; cousin of Preye and Timi. The whole season is Tari's homecoming.",
    culturalNote:
      "Embodies the huge Izon diaspora who left the creeks for the oil cities and are losing the language — the exact audience Beeli serves. 'Tari' (short, gender-neutral) is a common Ijaw name.",
    voice:
      "Younger voice. Speaks slowly, sometimes hesitant, occasionally mis-stresses a word (kept in the script as teachable moments). In the dialogue 'second pass' the LEARNER voices Tari's lines.",
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    id: "izon-cast-ebiere",
    name: "Ebiere",
    role: "The Keeper — grandmother, elder of the compound",
    persona:
      "70s, matriarch of the family compound in Isampou. Unhurried, firm, funny in a dry way, deeply literate in proverb and story. Does not flatter; commemorates milestones.",
    relationships:
      "Grandmother to Tari, Preye and Timi. Widow of a fisherman. The emotional spine of the series — she wants Tari to 'carry the words' before she is gone.",
    culturalNote:
      "The grandmother is the classic Izon transmitter of oral tradition, libation, and naming lore. Maps to 'Koko (grandmother)' in the design-course Izon pack.",
    voice:
      "Older female, rich low register, Kolokuma dialect (the education standard). Models careful, unhurried speech. Carries the heritage/oratory lines — which are flagged for a verified elder to record.",
    levels: ["beginner", "intermediate", "advanced"],
  },
  {
    id: "izon-cast-preye",
    name: "Preye",
    role: "The Bridge — cousin and peer",
    persona:
      "~24, lives in the village, fully fluent, teasing, quick. Translates the modern world for Ebiere and the old world for Tari. The comic engine of the skits.",
    relationships:
      "Tari's cousin and first friend back home; sibling of Timi. Ribs Tari constantly but has their back.",
    culturalNote:
      "The young, code-switching insider — bridges Pidgin/English and Izon the way real Delta youth do. Name 'Pịrịye' is attested in the codebase lesson notes.",
    voice:
      "Young adult, bright and fast, natural code-switch energy but ALWAYS speaks Izon on-mic (no English in audio — per the v2 template). Frequent dialogue partner (Speaker B).",
    levels: ["beginner", "intermediate"],
  },
  {
    id: "izon-cast-timi",
    name: "Timi",
    role: "The River-hand — young fisherman cousin",
    persona:
      "~28, practical, generous, a little boastful about his fishing. Teaches by doing: counting the catch, paddling, mending nets.",
    relationships:
      "Preye's older sibling, Tari's cousin. Apprenticed under Uncle Ere.",
    culturalNote:
      "The everyday working man of the creeks. 'Timi' (meaning tied to 'timipre' — good things) already appears as a speaker in the codebase (first-words, numbers-trade).",
    voice:
      "Young adult male, easy and rhythmic; good for the numbers/market counting drills and river work. Speaker A or B depending on episode.",
    levels: ["beginner", "intermediate"],
  },
  {
    id: "izon-cast-seibi",
    name: "Mama Seibi",
    role: "The Trader — market woman",
    persona:
      "50s, sharp, theatrical, the information hub of the town. Never loses a negotiation and enjoys them too much.",
    relationships:
      "Family friend; the market is her domain. Knows everyone's business.",
    culturalNote:
      "The market woman is central to Delta economic and social life; the floating/waterside market (foubai) is a genuine institution. Maps to 'Trader Seibi' in the design-course Izon pack.",
    voice:
      "Older female, loud, warm, fast when she smells a sale, slow when she wants sympathy on price. Carries the market/numbers episode.",
    levels: ["beginner", "intermediate"],
  },
  {
    id: "izon-cast-ere",
    name: "Uncle Ere",
    role: "The Elder Fisher — the working river",
    persona:
      "60s, spare of words, reads water and weather. Worries — quietly — that the fish are fewer than they were.",
    relationships:
      "Ebiere's late husband's brother; mentor to Timi. Uncle to the cousins.",
    culturalNote:
      "Carries the environmental thread of the season (the creeks under pressure) and the working-year knowledge. Maps to 'Uncle Ere (fisherman)' in the design-course Izon pack.",
    voice:
      "Older male, slow, weathered, economical. Delivers work-proverbs. Speaker A in the river episodes.",
    levels: ["intermediate", "advanced"],
  },
  {
    id: "izon-cast-amaokowei",
    name: "Pa Boma (Amaokowei)",
    role: "The Chief — ceremonial authority",
    persona:
      "70s, the community's ranking elder and orator. Formal register, weighs every word, settles disputes with proverb.",
    relationships:
      "Presides over the assembly and the festival. Ebiere's contemporary and old sparring partner.",
    culturalNote:
      "'Amaokowei' is a real Izon term for a town's ranking elder/chief (ama = town). Handles governance, the assembly, and the ceremonial libation. HERITAGE speech (praise oratory, libation) is flagged for verification by a real Izon elder/priest.",
    voice:
      "Oldest male voice, resonant, ceremonial cadence. Appears at the festival climax. All heritage lines are marked verify + isActive:false.",
    levels: ["intermediate", "advanced"],
  },
];

/** id → character, for quick lookup in episode files and tooling. */
export const IZON_CAST_BY_ID: Record<string, PodcastCharacter> = Object.fromEntries(
  IZON_CAST.map((c) => [c.id, c]),
);
