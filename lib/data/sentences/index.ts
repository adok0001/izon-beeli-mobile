import type { SentenceTemplate } from "@/types";
import { IZON_SENTENCES } from "./izon";
import { IGBO_SENTENCES } from "./igbo";
import { HAUSA_SENTENCES } from "./hausa";
import { SWAHILI_SENTENCES } from "./swahili";
import { AMHARIC_SENTENCES } from "./amharic";
import { WOLOF_SENTENCES } from "./wolof";
import { ARABIC_EGYPTIAN_SENTENCES } from "./arabic-egyptian";
import { SOMALI_SENTENCES } from "./somali";
import { BAMBARA_SENTENCES } from "./bambara";
import { TAMAZIGHT_SENTENCES } from "./tamazight";
import { KINYARWANDA_SENTENCES } from "./kinyarwanda";
import { EWE_SENTENCES } from "./ewe";

const SENTENCE_REGISTRY: Record<string, SentenceTemplate[]> = {
  izon: IZON_SENTENCES,
  igbo: IGBO_SENTENCES,
  hausa: HAUSA_SENTENCES,
  swahili: SWAHILI_SENTENCES,
  amharic: AMHARIC_SENTENCES,
  wolof: WOLOF_SENTENCES,
  "arabic-egyptian": ARABIC_EGYPTIAN_SENTENCES,
  somali: SOMALI_SENTENCES,
  bambara: BAMBARA_SENTENCES,
  tamazight: TAMAZIGHT_SENTENCES,
  kinyarwanda: KINYARWANDA_SENTENCES,
  ewe: EWE_SENTENCES,
};

export function getSentencesForLanguage(
  languageId: string
): SentenceTemplate[] {
  return SENTENCE_REGISTRY[languageId] ?? [];
}
