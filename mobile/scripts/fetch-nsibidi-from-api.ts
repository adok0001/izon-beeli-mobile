/**
 * Fetches all nsibidi characters from the Igbo API v2 and writes the full
 * dataset to mobile/lib/data/nsibidi/characters.ts.
 *
 * Run from the server/ directory (tsx is available there):
 *   IGBO_API_TOKEN=xxx npx tsx ../mobile/scripts/fetch-nsibidi-from-api.ts
 *
 * Or from mobile/ with:
 *   IGBO_API_TOKEN=xxx npx tsx scripts/fetch-nsibidi-from-api.ts
 *
 * Optional flags:
 *   --limit 100     stop after fetching N characters (for testing)
 *   --delay 300     ms to sleep between page fetches (default 250)
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NsibidiCategory } from "../lib/data/nsibidi/index.js";

const IGBO_API_BASE = "https://igboapi.com/api/v2";
const PAGE_SIZE = 10; // API v2 returns max 10 items per request

interface ApiNsibidiDefinition {
  text: string;
  id?: string;
}

interface ApiNsibidiCharacter {
  id: string;
  nsibidi: string;
  definitions: ApiNsibidiDefinition[];
  pronunciation?: string;
  wordClass?: string;
  radicals?: { id: string }[];
}

interface ApiNsibidiResponse {
  data: ApiNsibidiCharacter[];
  length: number;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// --- Category mapping ---
// Maps definition keywords to nsibidi categories.
// Keywords are checked in order; first match wins; "community" is the fallback.

const CATEGORY_RULES: { keywords: string[]; category: NsibidiCategory }[] = [
  {
    keywords: ["father", "mother", "child", "son", "daughter", "wife", "husband",
               "sibling", "brother", "sister", "kinsmen", "kinship", "ancestor",
               "grandparent", "offspring", "family", "relative", "baby", "infant"],
    category: "family",
  },
  {
    keywords: ["love", "unity", "bond", "marriage", "affection", "couple",
               "romance", "affectionate", "beloved", "sweetheart", "suitor"],
    category: "love",
  },
  {
    keywords: ["spirit", "god", "deity", "sacred", "prayer", "ritual",
               "divine", "oracle", "shrine", "chi", "heaven", "soul",
               "supernatural", "ancestor spirit", "shrine", "masquerade",
               "ancestral", "spiritual", "medicine", "charm", "magic"],
    category: "spirituality",
  },
  {
    keywords: ["king", "ruler", "chief", "authority", "leader", "strength",
               "warrior", "soldier", "power", "reign", "control", "rule",
               "govern", "throne", "royalty", "title", "nobility", "lord",
               "conquer", "victory", "fight", "war", "battle", "force"],
    category: "power",
  },
  {
    keywords: ["justice", "law", "court", "judgment", "truth", "right",
               "wrong", "crime", "punishment", "council", "elder", "judge",
               "arbitrate", "verdict", "penalty", "innocent", "guilty"],
    category: "justice",
  },
  {
    keywords: ["trade", "market", "money", "wealth", "goods", "price",
               "buy", "sell", "commerce", "exchange", "farm", "harvest",
               "work", "labor", "labour", "earnings", "profit", "coin",
               "merchandise", "shop", "business", "transaction", "pay", "debt"],
    category: "trade",
  },
  {
    keywords: ["tree", "water", "earth", "forest", "sun", "moon", "river",
               "mountain", "rain", "sky", "animal", "bird", "fish", "plant",
               "mud", "stone", "grass", "wood", "rock", "soil", "ground",
               "leaf", "seed", "flower", "river", "stream", "ocean", "sea",
               "land", "field", "crop", "cat", "dog", "snake", "insect",
               "butterfly", "frog", "ant", "worm", "lizard", "goat", "fowl",
               "yam", "cassava", "palm", "bush", "herb", "root", "fruit",
               "silk-cotton", "feline", "mole cricket"],
    category: "nature",
  },
  {
    keywords: ["community", "gathering", "assembly", "society", "meeting",
               "group", "public", "celebration", "festival", "village",
               "town", "people", "gathering", "crowd", "union", "club",
               "lodge", "ekpe", "dance", "music", "drum", "song"],
    category: "community",
  },
];

function assignCategory(definitions: ApiNsibidiDefinition[]): NsibidiCategory {
  const text = definitions.map((d) => d.text.toLowerCase()).join(" ");
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }
  return "community";
}

function formatEntry(c: ApiNsibidiCharacter, idx: number): string {
  const category = assignCategory(c.definitions);
  const meaning = c.definitions.map((d) => d.text).join("; ");
  const name = c.pronunciation
    ? c.pronunciation.charAt(0).toUpperCase() + c.pronunciation.slice(1)
    : `Character ${idx + 1}`;
  const codePoint = c.nsibidi.codePointAt(0) ?? 0;

  const fields = [
    `id: "ns-api-${idx + 1}"`,
    `character: ${JSON.stringify(c.nsibidi)}`,
    `codePoint: 0x${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
    `name: ${JSON.stringify(name)}`,
    `meaning: ${JSON.stringify(meaning)}`,
    `category: ${JSON.stringify(category)}`,
  ].join(", ");

  return `  { ${fields} },`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limitChars = Infinity;
  let delay = 250;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limitChars = parseInt(args[++i], 10);
    if (args[i] === "--delay" && args[i + 1]) delay = parseInt(args[++i], 10);
  }
  return { limitChars, delay };
}

async function fetchPage(page: number, token: string): Promise<ApiNsibidiResponse> {
  const url = `${IGBO_API_BASE}/nsibidi?page=${page}&limit=${PAGE_SIZE}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": token },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`API ${res.status} on page ${page}`);
  return res.json() as Promise<ApiNsibidiResponse>;
}

async function main() {
  const token = process.env.IGBO_API_TOKEN ?? process.env.EXPO_PUBLIC_IGBO_API_TOKEN;
  if (!token) throw new Error("Set IGBO_API_TOKEN or EXPO_PUBLIC_IGBO_API_TOKEN");

  const { limitChars, delay } = parseArgs();
  const outPath = resolve(__dirname, "../lib/data/nsibidi/characters.ts");

  console.log("Fetching first page to discover total count…");
  const first = await fetchPage(1, token);
  const totalAvailable = Math.min(first.length, limitChars);
  const totalPages = Math.ceil(totalAvailable / PAGE_SIZE);
  console.log(`Total nsibidi characters: ${first.length} (fetching up to ${totalAvailable})`);

  const allCharacters: ApiNsibidiCharacter[] = [];
  const processPage = (items: ApiNsibidiCharacter[]) => {
    for (const c of items) {
      if (!c.nsibidi || !c.definitions?.length) continue;
      if (allCharacters.length >= totalAvailable) break;
      allCharacters.push(c);
    }
  };

  processPage(first.data);
  console.log(`Page 1/${totalPages} — ${allCharacters.length} characters`);

  for (let page = 2; page <= totalPages; page++) {
    if (allCharacters.length >= totalAvailable) break;
    try {
      await sleep(delay);
      const { data } = await fetchPage(page, token);
      processPage(data);
      process.stdout.write(`\rPage ${page}/${totalPages} — ${allCharacters.length} characters`);
    } catch (err) {
      console.warn(`\n  Warning: page ${page} failed — ${err}`);
    }
  }

  console.log(`\n\nGenerating TypeScript file with ${allCharacters.length} characters…`);

  const lines = [
    `// AUTO-GENERATED by fetch-nsibidi-from-api.ts on ${new Date().toISOString()}`,
    `// Source: Igbo API v2 /nsibidi endpoint (https://igboapi.com)`,
    `// ${allCharacters.length} nsibidi characters — rendered via the Akagu font`,
    `import type { NsibidiCharacter } from "./index.js";`,
    ``,
    `export const NSIBIDI_API_CHARACTERS: NsibidiCharacter[] = [`,
    ...allCharacters.map((c, i) => formatEntry(c, i)),
    `];`,
    ``,
  ];

  writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`Wrote ${allCharacters.length} characters to:\n  ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
