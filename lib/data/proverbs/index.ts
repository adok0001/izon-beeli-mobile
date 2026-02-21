import type { Proverb } from "@/types";
import { IZON_PROVERBS } from "./izon";
import { YORUBA_PROVERBS } from "./yoruba";
import { AKAN_PROVERBS } from "./akan";
import { IGBO_PROVERBS } from "./igbo";
import { HAUSA_PROVERBS } from "./hausa";
import { SWAHILI_PROVERBS } from "./swahili";
import { AMHARIC_PROVERBS } from "./amharic";
import { WOLOF_PROVERBS } from "./wolof";
import { ARABIC_EGYPTIAN_PROVERBS } from "./arabic-egyptian";
import { SOMALI_PROVERBS } from "./somali";
import { BAMBARA_PROVERBS } from "./bambara";
import { TAMAZIGHT_PROVERBS } from "./tamazight";
import { KINYARWANDA_PROVERBS } from "./kinyarwanda";
import { EWE_PROVERBS } from "./ewe";

const PROVERB_REGISTRY: Record<string, Proverb[]> = {
  izon: IZON_PROVERBS,
  yoruba: YORUBA_PROVERBS,
  akan: AKAN_PROVERBS,
  igbo: IGBO_PROVERBS,
  hausa: HAUSA_PROVERBS,
  swahili: SWAHILI_PROVERBS,
  amharic: AMHARIC_PROVERBS,
  wolof: WOLOF_PROVERBS,
  "arabic-egyptian": ARABIC_EGYPTIAN_PROVERBS,
  somali: SOMALI_PROVERBS,
  bambara: BAMBARA_PROVERBS,
  tamazight: TAMAZIGHT_PROVERBS,
  kinyarwanda: KINYARWANDA_PROVERBS,
  ewe: EWE_PROVERBS,
};

export function getProverbsForLanguage(languageId: string): Proverb[] {
  return PROVERB_REGISTRY[languageId] ?? [];
}

export function getAllProverbs(): Proverb[] {
  return Object.values(PROVERB_REGISTRY).flat();
}
