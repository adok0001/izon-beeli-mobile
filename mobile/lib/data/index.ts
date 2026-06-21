import type { DictionaryEntry } from "@/lib/dictionary";
import { IZON_DICTIONARY } from "./izon";
import { YORUBA_DICTIONARY } from "./yoruba";
import { IGBO_DICTIONARY } from "./igbo";
import { HAUSA_DICTIONARY } from "./hausa";
import { SWAHILI_DICTIONARY } from "./swahili";
import { AMHARIC_DICTIONARY } from "./amharic";
import { AKAN_DICTIONARY } from "./akan";
import { WOLOF_DICTIONARY } from "./wolof";
import { ARABIC_EGYPTIAN_DICTIONARY } from "./arabic-egyptian";
import { SOMALI_DICTIONARY } from "./somali";
import { BAMBARA_DICTIONARY } from "./bambara";
import { TAMAZIGHT_DICTIONARY } from "./tamazight";
import { KINYARWANDA_DICTIONARY } from "./kinyarwanda";
import { EWE_DICTIONARY } from "./ewe";
import { OROMO_DICTIONARY } from "./oromo";
import { SHONA_DICTIONARY } from "./shona";
import { EFIK_DICTIONARY } from "./efik";
import { NDEBELE_DICTIONARY } from "./ndebele";

const DICTIONARY_REGISTRY: Record<string, DictionaryEntry[]> = {
  izon: IZON_DICTIONARY,
  yoruba: YORUBA_DICTIONARY,
  igbo: IGBO_DICTIONARY,
  hausa: HAUSA_DICTIONARY,
  swahili: SWAHILI_DICTIONARY,
  amharic: AMHARIC_DICTIONARY,
  akan: AKAN_DICTIONARY,
  wolof: WOLOF_DICTIONARY,
  "arabic-egyptian": ARABIC_EGYPTIAN_DICTIONARY,
  somali: SOMALI_DICTIONARY,
  bambara: BAMBARA_DICTIONARY,
  tamazight: TAMAZIGHT_DICTIONARY,
  kinyarwanda: KINYARWANDA_DICTIONARY,
  ewe: EWE_DICTIONARY,
  oromo: OROMO_DICTIONARY,
  shona: SHONA_DICTIONARY,
  efik: EFIK_DICTIONARY,
  ndebele: NDEBELE_DICTIONARY,
};

export function getDictionaryForLanguage(languageId: string): DictionaryEntry[] {
  return DICTIONARY_REGISTRY[languageId] ?? [];
}
