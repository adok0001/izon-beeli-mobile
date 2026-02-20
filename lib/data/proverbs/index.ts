import type { Proverb } from "@/types";
import { IZON_PROVERBS } from "./izon";
import { YORUBA_PROVERBS } from "./yoruba";
import { AKAN_PROVERBS } from "./akan";

const PROVERB_REGISTRY: Record<string, Proverb[]> = {
  izon: IZON_PROVERBS,
  yoruba: YORUBA_PROVERBS,
  akan: AKAN_PROVERBS,
};

export function getProverbsForLanguage(languageId: string): Proverb[] {
  return PROVERB_REGISTRY[languageId] ?? [];
}

export function getAllProverbs(): Proverb[] {
  return Object.values(PROVERB_REGISTRY).flat();
}
