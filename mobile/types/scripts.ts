/**
 * Writing-system types shared by the Nsibidi, Ge'ez/Fidel, and Adinkra
 * exploration screens. Data for these now comes from the server (`/scripts`,
 * see `lib/hooks/use-script-data.ts`) rather than a bundled data file, but the
 * shapes below are unchanged so the existing screens/components need no
 * further changes beyond their data source.
 */

export type NsibidiCategory =
  | "community"
  | "love"
  | "power"
  | "nature"
  | "justice"
  | "family"
  | "spirituality"
  | "trade";

export const NSIBIDI_CATEGORY_LABELS: Record<NsibidiCategory, string> = {
  community: "Community & Society",
  love: "Love & Unity",
  power: "Power & Leadership",
  nature: "Nature & Environment",
  justice: "Justice & Law",
  family: "Family & Kinship",
  spirituality: "Spirituality & Ritual",
  trade: "Trade & Wealth",
};

export interface NsibidiCharacter {
  id: string;
  character: string; // Unicode string rendered with the Akagu font
  codePoint: number; // Primary Unicode code point of the character
  name: string; // English label (romanized Igbo pronunciation or name)
  meaning: string; // Conceptual meaning in English
  category: NsibidiCategory;
}

export interface GeezCharacter {
  id: string;
  character: string;
  baseConsonant: string;
  order: number; // 1-7 vowel order
  romanization: string;
}

export type AdinkraCategory =
  | "leadership"
  | "wisdom"
  | "perseverance"
  | "unity"
  | "spirituality"
  | "love";

export interface AdinkraSymbol {
  id: string;
  name: string;
  akanName: string;
  meaning: string;
  proverb: string;
  svgPath: string;
  svgViewBox: string;
  category: AdinkraCategory;
}
