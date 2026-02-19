#!/usr/bin/env node
/**
 * Parse a VOCABULARY.csv into TypeScript DictionaryEntry[] output.
 *
 * Usage:
 *   node scripts/parse-vocabulary.js <input.csv> [--language=izon] [--start-id=403]
 *
 * CSV format:
 *   word,english,category,pronunciation,example,exampleTranslation
 */

const fs = require("fs");
const path = require("path");

const VALID_CATEGORIES = [
  "greetings", "numbers", "family", "pronouns", "time", "verbs",
  "body", "market", "occupations", "nouns", "phrases", "food",
  "possessives", "ordinals", "commands", "animals", "phonetics", "money",
];

function parseArgs(args) {
  const opts = { language: "izon", startId: 1 };
  let inputFile = null;

  for (const arg of args) {
    if (arg.startsWith("--language=")) {
      opts.language = arg.split("=")[1];
    } else if (arg.startsWith("--start-id=")) {
      opts.startId = parseInt(arg.split("=")[1], 10);
    } else if (!arg.startsWith("--")) {
      inputFile = arg;
    }
  }

  return { inputFile, ...opts };
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function main() {
  const { inputFile, language, startId } = parseArgs(process.argv.slice(2));

  if (!inputFile) {
    console.error("Usage: node scripts/parse-vocabulary.js <input.csv> [--language=izon] [--start-id=403]");
    process.exit(1);
  }

  const content = fs.readFileSync(path.resolve(inputFile), "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  // Skip header
  const header = lines[0].toLowerCase();
  const dataLines = header.includes("word") && header.includes("english") ? lines.slice(1) : lines;

  const entries = [];
  const seen = new Set();
  let id = startId;

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCsvLine(dataLines[i]);
    const [word, english, category, pronunciation, example, exampleTranslation] = fields;

    if (!word || !english) {
      console.warn(`Line ${i + 2}: Skipping — missing word or english`);
      continue;
    }

    const cat = (category || "nouns").toLowerCase();
    if (!VALID_CATEGORIES.includes(cat)) {
      console.warn(`Line ${i + 2}: Invalid category "${cat}" for "${word}" — defaulting to "nouns"`);
    }

    const key = word.toLowerCase();
    if (seen.has(key)) {
      console.warn(`Line ${i + 2}: Duplicate word "${word}" — skipping`);
      continue;
    }
    seen.add(key);

    const validCat = VALID_CATEGORIES.includes(cat) ? cat : "nouns";

    const parts = [`  e(${id}, ${JSON.stringify(word)}, ${JSON.stringify(english)}, ${JSON.stringify(validCat)}`];
    if (pronunciation) parts.push(`, ${JSON.stringify(pronunciation)}`);
    else if (example) parts.push(", undefined");
    if (example) parts.push(`, ${JSON.stringify(example)}`);
    else if (exampleTranslation) parts.push(", undefined");
    if (exampleTranslation) parts.push(`, ${JSON.stringify(exampleTranslation)}`);
    parts.push("),");

    entries.push(parts.join(""));
    id++;
  }

  // Output TypeScript
  console.log(`import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";`);
  console.log("");
  console.log(`function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string): DictionaryEntry {`);
  console.log(`  return { id: \`d\${id}\`, word, english, category, languageId: ${JSON.stringify(language)}, pronunciation, example, exampleTranslation };`);
  console.log(`}`);
  console.log("");
  console.log(`export const DICTIONARY: DictionaryEntry[] = [`);
  for (const entry of entries) {
    console.log(entry);
  }
  console.log(`];`);

  console.error(`\n✓ Parsed ${entries.length} entries (d${startId}–d${id - 1}) for language "${language}"`);
}

main();
