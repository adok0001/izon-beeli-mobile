import type { IconSymbolName } from "@/components/ui/icon-symbol";
import type { CulturalCategory } from "@/types";

/** Icon per cultural category — the glyph shown on culture cards, headers, and filters. */
export const CULTURE_CATEGORY_ICON: Record<CulturalCategory, IconSymbolName> = {
  colors: "paintpalette.fill",
  naming_ceremonies: "figure.child",
  festivals: "party.popper.fill",
  creation_myths: "sparkles",
  music: "music.note",
  clothing: "tshirt.fill",
  cuisine: "fork.knife",
  greetings_etiquette: "hand.wave.fill",
  governance_values: "building.columns.fill",
  land_livelihood: "leaf.fill",
  kinship: "person.3.fill",
  cosmology: "moon.stars.fill",
  oral_tradition: "book.fill",
  arts_oratory: "theatermasks.fill",
  numbers_trade: "number.square.fill",
  geography: "map.fill",
};
