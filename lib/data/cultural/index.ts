import type { CulturalCategory, CulturalContent } from "@/types";
import { IZON_CULTURAL } from "./izon";
import { YORUBA_CULTURAL } from "./yoruba";
import { AKAN_CULTURAL } from "./akan";

const CULTURAL_REGISTRY: Record<string, CulturalContent[]> = {
  izon: IZON_CULTURAL,
  yoruba: YORUBA_CULTURAL,
  akan: AKAN_CULTURAL,
};

export function getCulturalContent(languageId: string): CulturalContent[] {
  return CULTURAL_REGISTRY[languageId] ?? [];
}

export function getCulturalCategories(): {
  id: CulturalCategory;
  label: string;
  emoji: string;
}[] {
  return [
    { id: "colors", label: "Colors", emoji: "\uD83C\uDFA8" },
    { id: "naming_ceremonies", label: "Naming", emoji: "\uD83D\uDC76" },
    { id: "festivals", label: "Festivals", emoji: "\uD83C\uDF89" },
    { id: "creation_myths", label: "Myths & Stories", emoji: "\uD83C\uDF1F" },
    { id: "music", label: "Music", emoji: "\uD83C\uDFB5" },
    { id: "clothing", label: "Clothing", emoji: "\uD83E\udDE3" },
    { id: "cuisine", label: "Cuisine", emoji: "\uD83C\uDF5C" },
    { id: "greetings_etiquette", label: "Greetings", emoji: "\uD83D\uDC4B" },
  ];
}
