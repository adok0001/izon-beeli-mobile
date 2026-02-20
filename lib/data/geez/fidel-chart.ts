export interface GeezCharacter {
  id: string;
  character: string;
  baseConsonant: string;
  order: number; // 1-7 vowel order
  romanization: string;
}

/**
 * First 10 consonant families of the Ge'ez/Fidel script, each with 7 vowel orders.
 * Characters use Unicode Ethiopic block (U+1200-U+137F).
 *
 * Vowel order convention:
 *   1 = e (ge'ez), 2 = u, 3 = i, 4 = a, 5 = e (5th), 6 = e/schwa, 7 = o
 */

const families: {
  name: string;
  start: number; // Unicode code point for 1st order
  romanizations: [string, string, string, string, string, string, string];
}[] = [
  {
    name: "ha",
    start: 0x1200,
    romanizations: ["he", "hu", "hi", "ha", "he\u0304", "he\u0259", "ho"],
  },
  {
    name: "la",
    start: 0x1208,
    romanizations: ["le", "lu", "li", "la", "le\u0304", "le\u0259", "lo"],
  },
  {
    name: "hha",
    start: 0x1210,
    romanizations: [
      "\u1E25e",
      "\u1E25u",
      "\u1E25i",
      "\u1E25a",
      "\u1E25e\u0304",
      "\u1E25e\u0259",
      "\u1E25o",
    ],
  },
  {
    name: "ma",
    start: 0x1218,
    romanizations: ["me", "mu", "mi", "ma", "me\u0304", "me\u0259", "mo"],
  },
  {
    name: "sza",
    start: 0x1220,
    romanizations: [
      "\u015Be",
      "\u015Bu",
      "\u015Bi",
      "\u015Ba",
      "\u015Be\u0304",
      "\u015Be\u0259",
      "\u015Bo",
    ],
  },
  {
    name: "ra",
    start: 0x1228,
    romanizations: ["re", "ru", "ri", "ra", "re\u0304", "re\u0259", "ro"],
  },
  {
    name: "sa",
    start: 0x1230,
    romanizations: ["se", "su", "si", "sa", "se\u0304", "se\u0259", "so"],
  },
  {
    name: "sha",
    start: 0x1238,
    romanizations: [
      "\u0161e",
      "\u0161u",
      "\u0161i",
      "\u0161a",
      "\u0161e\u0304",
      "\u0161e\u0259",
      "\u0161o",
    ],
  },
  {
    name: "qa",
    start: 0x1240,
    romanizations: ["qe", "qu", "qi", "qa", "qe\u0304", "qe\u0259", "qo"],
  },
  {
    name: "ba",
    start: 0x1260,
    romanizations: ["be", "bu", "bi", "ba", "be\u0304", "be\u0259", "bo"],
  },
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
