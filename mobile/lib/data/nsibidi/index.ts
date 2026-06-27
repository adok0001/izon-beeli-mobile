export interface NsibidiCharacter {
  id: string;
  character: string;       // Unicode string rendered with the Akagu font
  codePoint: number;       // Primary Unicode code point of the character
  name: string;            // English label (romanized Igbo pronunciation or name)
  meaning: string;         // Conceptual meaning in English
  category: NsibidiCategory;
}

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

function n(
  id: number,
  codePoint: number,
  name: string,
  meaning: string,
  category: NsibidiCategory
): NsibidiCharacter {
  return {
    id: `ns-${id}`,
    character: String.fromCodePoint(codePoint),
    codePoint,
    name,
    meaning,
    category,
  };
}

// Curated reference set of 20 key symbols — used as the "featured" display in the
// nsibidi intro lesson. Encoding uses CJK code points that the Akagu font maps to
// nsibidi glyphs. Full dataset (~2,572) lives in nsibidi/characters.ts.
export const NSIBIDI_CHARACTERS: NsibidiCharacter[] = [
  n(1,  0xE001, "Ékpè", "Leopard society / sacred assembly", "community"),
  n(2,  0xE002, "Ọfọ", "Staff of justice and righteousness", "justice"),
  n(3,  0xE003, "Ihu n'ihu", "Face to face / mutual understanding", "community"),
  n(4,  0xE004, "Nwunye", "Wife / marital bond", "love"),
  n(5,  0xE005, "Di", "Husband / partnership", "love"),
  n(6,  0xE006, "Ọha", "Community gathering / public forum", "community"),
  n(7,  0xE007, "Eze", "King / ruler", "power"),
  n(8,  0xE008, "Ọchichi", "Governance / leadership", "power"),
  n(9,  0xE009, "Ọhịa", "Forest / untamed nature", "nature"),
  n(10, 0xE00A, "Mmiri", "Water / river / flow of life", "nature"),
  n(11, 0xE00B, "Anyanwụ", "Sun / divine light", "spirituality"),
  n(12, 0xE00C, "Ọnwa", "Moon / feminine energy", "spirituality"),
  n(13, 0xE00D, "Ụmụnna", "Kinsmen / extended family", "family"),
  n(14, 0xE00E, "Nna", "Father / paternal authority", "family"),
  n(15, 0xE00F, "Nne", "Mother / nurturing", "family"),
  n(16, 0xE010, "Ahịa", "Market / trade and exchange", "trade"),
  n(17, 0xE011, "Ego", "Money / wealth / resources", "trade"),
  n(18, 0xE012, "Ọjị", "Kola nut / sacred offering", "spirituality"),
  n(19, 0xE013, "Chi", "Personal spirit / destiny", "spirituality"),
  n(20, 0xE014, "Ikenga", "Personal strength / achievement", "power"),
];

