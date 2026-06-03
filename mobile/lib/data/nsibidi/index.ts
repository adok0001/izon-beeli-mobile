export interface NsibidiCharacter {
  id: string;
  character: string;       // PUA code point string rendered with Akagu font
  codePoint: number;       // Unicode PUA code point (0xE000–0xF8FF range)
  name: string;            // English label
  meaning: string;         // Conceptual meaning
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

// Representative sample set sourced from the Nkọwa okwu / Igbo API dataset.
// Full character set (~2,572) is available via the Igbo API /nsibidi endpoint.
// Rendering requires the Akagu font (see mobile/assets/fonts/Akagu.ttf).
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
