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
import { IZON_BASICS_LESSONS } from "./izon-basics";
import { IZON_CONVERSATIONAL_LESSONS } from "./izon-conversational";
import { IZON_NUMBERS_LESSONS } from "./izon-numbers";
import { IZON_PHONETICS_LESSONS } from "./izon-phonetics";
import { IZON_STORIES_LESSONS } from "./izon-stories";
import { KINYARWANDA_LESSONS } from "./kinyarwanda";
import { SOMALI_LESSONS } from "./somali";
import { SWAHILI_LESSONS } from "./swahili";
import { TAMAZIGHT_LESSONS } from "./tamazight";
import { WOLOF_LESSONS } from "./wolof";
import { YORUBA_LESSONS } from "./yoruba";

export type { LessonData, TranscriptSegment } from "./types";

export const ALL_LESSONS: LessonData[] = [
  ...IZON_BASICS_LESSONS,
  ...IZON_STORIES_LESSONS,
  ...IZON_CONVERSATIONAL_LESSONS,
  ...IZON_PHONETICS_LESSONS,
  ...IZON_NUMBERS_LESSONS,
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
