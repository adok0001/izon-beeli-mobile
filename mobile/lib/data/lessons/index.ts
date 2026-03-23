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
import { AKAN_SONGS } from "./akan-songs";
import { AMHARIC_LESSONS } from "./amharic";
import { AMHARIC_SONGS } from "./amharic-songs";
import { ARABIC_EGYPTIAN_LESSONS } from "./arabic-egyptian";
import { ARABIC_EGYPTIAN_SONGS } from "./arabic-egyptian-songs";
import { BAMBARA_LESSONS } from "./bambara";
import { BAMBARA_SONGS } from "./bambara-songs";
import { EWE_LESSONS } from "./ewe";
import { EWE_SONGS } from "./ewe-songs";
import { HAUSA_LESSONS } from "./hausa";
import { HAUSA_SONGS } from "./hausa-songs";
import { IGBO_LESSONS } from "./igbo";
import { IGBO_SONGS } from "./igbo-songs";
import { IZON_FIRST_WORDS_LESSONS } from "./izon-first-words";
import { IZON_SOUND_SCRIPT_LESSONS } from "./izon-sound-script";
import { IZON_NUMBERS_TRADE_LESSONS } from "./izon-numbers-trade";
import { IZON_COMMUNICATIVE_LESSONS } from "./izon-communicative";
import { IZON_COLOURS_LESSONS } from "./izon-colours";
import { IZON_ORAL_TRADITION_LESSONS } from "./izon-oral-tradition";
import { IZON_SONGS } from "./izon-songs";
import { KINYARWANDA_LESSONS } from "./kinyarwanda";
import { KINYARWANDA_SONGS } from "./kinyarwanda-songs";
import { SOMALI_LESSONS } from "./somali";
import { SOMALI_SONGS } from "./somali-songs";
import { SWAHILI_LESSONS } from "./swahili";
import { SWAHILI_SONGS } from "./swahili-songs";
import { TAMAZIGHT_LESSONS } from "./tamazight";
import { TAMAZIGHT_SONGS } from "./tamazight-songs";
import { WOLOF_LESSONS } from "./wolof";
import { WOLOF_SONGS } from "./wolof-songs";
import { YORUBA_LESSONS } from "./yoruba";
import { YORUBA_SONGS } from "./yoruba-songs";

export type { LessonData, LessonType, TranscriptSegment } from "./types";

export const ALL_LESSONS: LessonData[] = [
  ...IZON_FIRST_WORDS_LESSONS,
  ...IZON_SOUND_SCRIPT_LESSONS,
  ...IZON_NUMBERS_TRADE_LESSONS,
  ...IZON_COMMUNICATIVE_LESSONS,
  ...IZON_COLOURS_LESSONS,
  ...IZON_ORAL_TRADITION_LESSONS,
  ...IZON_SONGS,
  ...YORUBA_LESSONS,
  ...YORUBA_SONGS,
  ...IGBO_LESSONS,
  ...IGBO_SONGS,
  ...HAUSA_LESSONS,
  ...HAUSA_SONGS,
  ...SWAHILI_LESSONS,
  ...SWAHILI_SONGS,
  ...AMHARIC_LESSONS,
  ...AMHARIC_SONGS,
  ...AKAN_LESSONS,
  ...AKAN_SONGS,
  ...WOLOF_LESSONS,
  ...WOLOF_SONGS,
  ...ARABIC_EGYPTIAN_LESSONS,
  ...ARABIC_EGYPTIAN_SONGS,
  ...SOMALI_LESSONS,
  ...SOMALI_SONGS,
  ...BAMBARA_LESSONS,
  ...BAMBARA_SONGS,
  ...TAMAZIGHT_LESSONS,
  ...TAMAZIGHT_SONGS,
  ...KINYARWANDA_LESSONS,
  ...KINYARWANDA_SONGS,
  ...EWE_LESSONS,
  ...EWE_SONGS,
];
