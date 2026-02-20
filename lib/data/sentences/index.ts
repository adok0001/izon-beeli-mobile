import type { SentenceTemplate } from "@/types";
import { IZON_SENTENCES } from "./izon";

const SENTENCE_REGISTRY: Record<string, SentenceTemplate[]> = {
  izon: IZON_SENTENCES,
};

export function getSentencesForLanguage(
  languageId: string
): SentenceTemplate[] {
  return SENTENCE_REGISTRY[languageId] ?? [];
}
