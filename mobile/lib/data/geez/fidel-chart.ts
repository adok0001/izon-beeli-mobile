export interface GeezCharacter {
  id: string;
  character: string;
  baseConsonant: string;
  order: number; // 1-7 vowel order
  romanization: string;
}

/**
 * Full standard Amharic Fidel — 31 consonant families, each with 7 vowel orders.
 * Characters use Unicode Ethiopic block (U+1200–U+137F).
 *
 * Vowel order convention:
 *   1 = e (Ge'ez / 1st), 2 = u, 3 = i, 4 = a, 5 = ē (5th), 6 = ə (schwa/6th), 7 = o
 *
 * Omitted intentionally:
 *   ሠ sza (0x1220) — archaic, not used in modern Amharic
 *   ኀ hha2 (0x1280) — archaic
 *   ፀ tzha (0x1340) — archaic duplicate of ጸ
 *   ቐ qha (0x1250) — Tigrinya-specific
 *   ኸ kxa (0x12B8) — Tigrinya-specific
 *   ዸ dda (0x12F8) — inconsistent Unicode rendering
 */

const families: {
  name: string;
  label: string; // display name shown in chart header
  start: number; // Unicode code point for 1st order
  romanizations: [string, string, string, string, string, string, string];
}[] = [
  // ──── Group 1: Basic stops & sonorants ────
  { name: "ha",  label: "ሀ",  start: 0x1200, romanizations: ["he",  "hu",  "hi",  "ha",  "hē",  "hə",  "ho"]  },
  { name: "la",  label: "ለ",  start: 0x1208, romanizations: ["le",  "lu",  "li",  "la",  "lē",  "lə",  "lo"]  },
  { name: "hha", label: "ሐ",  start: 0x1210, romanizations: ["ḥe",  "ḥu",  "ḥi",  "ḥa",  "ḥē",  "ḥə",  "ḥo"]  },
  { name: "ma",  label: "መ",  start: 0x1218, romanizations: ["me",  "mu",  "mi",  "ma",  "mē",  "mə",  "mo"]  },
  { name: "ra",  label: "ረ",  start: 0x1228, romanizations: ["re",  "ru",  "ri",  "ra",  "rē",  "rə",  "ro"]  },
  { name: "sa",  label: "ሰ",  start: 0x1230, romanizations: ["se",  "su",  "si",  "sa",  "sē",  "sə",  "so"]  },
  { name: "sha", label: "ሸ",  start: 0x1238, romanizations: ["še",  "šu",  "ši",  "ša",  "šē",  "šə",  "šo"]  },
  // ──── Group 2: Velars ────
  { name: "qa",  label: "ቀ",  start: 0x1240, romanizations: ["qe",  "qu",  "qi",  "qa",  "qē",  "qə",  "qo"]  },
  { name: "ba",  label: "በ",  start: 0x1260, romanizations: ["be",  "bu",  "bi",  "ba",  "bē",  "bə",  "bo"]  },
  { name: "va",  label: "ቨ",  start: 0x1268, romanizations: ["ve",  "vu",  "vi",  "va",  "vē",  "və",  "vo"]  },
  // ──── Group 3: Dentals & palatals ────
  { name: "ta",  label: "ተ",  start: 0x1270, romanizations: ["te",  "tu",  "ti",  "ta",  "tē",  "tə",  "to"]  },
  { name: "cha", label: "ቸ",  start: 0x1278, romanizations: ["če",  "ču",  "či",  "ča",  "čē",  "čə",  "čo"]  },
  // ──── Group 4: Nasals & glides ────
  { name: "na",  label: "ነ",  start: 0x1290, romanizations: ["ne",  "nu",  "ni",  "na",  "nē",  "nə",  "no"]  },
  { name: "nya", label: "ኘ",  start: 0x1298, romanizations: ["ñe",  "ñu",  "ñi",  "ña",  "ñē",  "ñə",  "ño"]  },
  { name: "a",   label: "አ",  start: 0x12A0, romanizations: ["ʾe",  "ʾu",  "ʾi",  "ʾa",  "ʾē",  "ʾə",  "ʾo"]  },
  { name: "ka",  label: "ከ",  start: 0x12A8, romanizations: ["ke",  "ku",  "ki",  "ka",  "kē",  "kə",  "ko"]  },
  { name: "wa",  label: "ወ",  start: 0x12C8, romanizations: ["we",  "wu",  "wi",  "wa",  "wē",  "wə",  "wo"]  },
  { name: "aa",  label: "ዐ",  start: 0x12D0, romanizations: ["ʿe",  "ʿu",  "ʿi",  "ʿa",  "ʿē",  "ʿə",  "ʿo"]  },
  // ──── Group 5: Sibilants & fricatives ────
  { name: "za",  label: "ዘ",  start: 0x12D8, romanizations: ["ze",  "zu",  "zi",  "za",  "zē",  "zə",  "zo"]  },
  { name: "zha", label: "ዠ",  start: 0x12E0, romanizations: ["že",  "žu",  "ži",  "ža",  "žē",  "žə",  "žo"]  },
  { name: "ya",  label: "የ",  start: 0x12E8, romanizations: ["ye",  "yu",  "yi",  "ya",  "yē",  "yə",  "yo"]  },
  // ──── Group 6: More stops ────
  { name: "da",  label: "ደ",  start: 0x12F0, romanizations: ["de",  "du",  "di",  "da",  "dē",  "də",  "do"]  },
  { name: "ja",  label: "ጀ",  start: 0x1300, romanizations: ["ǧe",  "ǧu",  "ǧi",  "ǧa",  "ǧē",  "ǧə",  "ǧo"]  },
  { name: "ga",  label: "ገ",  start: 0x1308, romanizations: ["ge",  "gu",  "gi",  "ga",  "gē",  "gə",  "go"]  },
  // ──── Group 7: Ejectives (glottalized consonants) ────
  { name: "tha", label: "ጠ",  start: 0x1320, romanizations: ["ṭe",  "ṭu",  "ṭi",  "ṭa",  "ṭē",  "ṭə",  "ṭo"]  },
  { name: "Cha", label: "ጨ",  start: 0x1328, romanizations: ["č̣e", "č̣u", "č̣i", "č̣a", "č̣ē", "č̣ə", "č̣o"] },
  { name: "pha", label: "ጰ",  start: 0x1330, romanizations: ["p̣e",  "p̣u",  "p̣i",  "p̣a",  "p̣ē",  "p̣ə",  "p̣o"]  },
  { name: "tsa", label: "ጸ",  start: 0x1338, romanizations: ["ṣe",  "ṣu",  "ṣi",  "ṣa",  "ṣē",  "ṣə",  "ṣo"]  },
  // ──── Group 8: Labials ────
  { name: "fa",  label: "ፈ",  start: 0x1348, romanizations: ["fe",  "fu",  "fi",  "fa",  "fē",  "fə",  "fo"]  },
  { name: "pa",  label: "ፐ",  start: 0x1350, romanizations: ["pe",  "pu",  "pi",  "pa",  "pē",  "pə",  "po"]  },
];

function buildChart(): GeezCharacter[] {
  const chars: GeezCharacter[] = [];
  for (const family of families) {
    for (let order = 1; order <= 7; order++) {
      chars.push({
        id: `${family.name}-${order}`,
        character: String.fromCodePoint(family.start + (order - 1)),
        baseConsonant: family.name,
        order,
        romanization: family.romanizations[order - 1],
      });
    }
  }
  return chars;
}

export const FIDEL_CHART: GeezCharacter[] = buildChart();

export const CONSONANT_FAMILIES: string[] = families.map((f) => f.name);

/** Label (the 1st-order Ge'ez character) for each family, for use in the grid header column */
export const FAMILY_LABELS: Record<string, string> = Object.fromEntries(
  families.map((f) => [f.name, f.label])
);

/** Logical grouping for display in the chart */
export const FAMILY_GROUPS: { label: string; families: string[] }[] = [
  { label: "Basic", families: ["ha", "la", "hha", "ma", "ra", "sa", "sha"] },
  { label: "Velars", families: ["qa", "ba", "va"] },
  { label: "Dentals", families: ["ta", "cha"] },
  { label: "Nasals & Glides", families: ["na", "nya", "a", "ka", "wa", "aa"] },
  { label: "Sibilants", families: ["za", "zha", "ya"] },
  { label: "Stops", families: ["da", "ja", "ga"] },
  { label: "Ejectives", families: ["tha", "Cha", "pha", "tsa"] },
  { label: "Labials", families: ["fa", "pa"] },
];
