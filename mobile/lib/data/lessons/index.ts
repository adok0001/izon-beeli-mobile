/**
 * Barrel export — aggregates every language's lessons into a single flat array.
 *
 * To add a new language or course:
 *   1. Create a new file in this folder (e.g. zulu.ts)
 *   2. Export a named array of LessonData[]
 *   3. Import & spread it into ALL_LESSONS below
 */
import type { LessonData } from "./types";

import { AKAN_LESSONS } from "./akan";
import { AMHARIC_LESSONS } from "./amharic";
import { ARABIC_EGYPTIAN_LESSONS } from "./arabic-egyptian";
import { BAMBARA_LESSONS } from "./bambara";
import { EWE_LESSONS } from "./ewe";
import { HAUSA_LESSONS } from "./hausa";
import { IGBO_LESSONS } from "./igbo";
import { IZON_FIRST_WORDS_LESSONS } from "./izon-first-words";
import { IZON_SOUND_SCRIPT_LESSONS } from "./izon-sound-script";
import { IZON_NUMBERS_TRADE_LESSONS } from "./izon-numbers-trade";
import { IZON_COMMUNICATIVE_LESSONS } from "./izon-communicative";
import { IZON_COLOURS_LESSONS } from "./izon-colours";
import { IZON_ORAL_TRADITION_LESSONS } from "./izon-oral-tradition";
import { KINYARWANDA_LESSONS } from "./kinyarwanda";
import { SOMALI_LESSONS } from "./somali";
import { SWAHILI_LESSONS } from "./swahili";
import { TAMAZIGHT_LESSONS } from "./tamazight";
import { WOLOF_LESSONS } from "./wolof";
import { YORUBA_LESSONS } from "./yoruba";

export type { LessonData, TranscriptSegment } from "./types";

export const ALL_LESSONS: LessonData[] = [
  ...IZON_FIRST_WORDS_LESSONS,
  ...IZON_SOUND_SCRIPT_LESSONS,
  ...IZON_NUMBERS_TRADE_LESSONS,
  ...IZON_COMMUNICATIVE_LESSONS,
  ...IZON_COLOURS_LESSONS,
  ...IZON_ORAL_TRADITION_LESSONS,
  ...YORUBA_LESSONS,
  ...IGBO_LESSONS,
  ...HAUSA_LESSONS,
  ...SWAHILI_LESSONS,
  ...AMHARIC_LESSONS,
  ...AKAN_LESSONS,
  ...WOLOF_LESSONS,
  ...ARABIC_EGYPTIAN_LESSONS,
  ...SOMALI_LESSONS,
  ...BAMBARA_LESSONS,
  ...TAMAZIGHT_LESSONS,
  ...KINYARWANDA_LESSONS,
  ...EWE_LESSONS,
];
