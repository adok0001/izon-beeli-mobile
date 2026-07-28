#!/usr/bin/env node
/**
 * Parse a VOCABULARY.csv into TypeScript DictionaryEntry[] output.
 *
 * Usage:
 *   node scripts/parse-vocabulary.js <input.csv> [--language=izon] [--start-id=403]
 *
 * Supported CSV formats (auto-detected from header):
 *
 *   Simple format:
 *     word,english,category,pronunciation,example,exampleTranslation
 *
 *   Portal export format:
 *     native_word,category,pronunciation,english_translation,
 *     example_sentence_native,example_sentence_english,
 *     audio_url,contributor_name,contributor_id,
 *     part_of_speech,cultural_context,dialect,difficulty_level,
 *     submission_id,approved_date,learners_exposed
 */

/* global __dirname */
const fs = require("fs");
const path = require("path");

/**
 * Read the canonical category list out of lib/dictionary.ts rather than keeping
 * a literal here. This script is plain CJS (run via `node`), so it can't import
 * the TS module — but a stale copy is worse: unknown categories are silently
 * rewritten to "nouns" below, so a list that lags behind mis-files every row in
 * the categories it is missing.
 */
function readValidCategories() {
  const source = fs.readFileSync(path.join(__dirname, "../lib/dictionary.ts"), "utf8");
  const block = /export const DICTIONARY_CATEGORY_VALUES = \[([\s\S]*?)\] as const;/.exec(source);
  if (!block) throw new Error("Could not find DICTIONARY_CATEGORY_VALUES in lib/dictionary.ts");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const VALID_CATEGORIES = readValidCategories();

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

function buildColMap(headerFields) {
  const idx = (name) => headerFields.indexOf(name);
  if (headerFields.includes("native_word") || headerFields.includes("english_translation")) {
    return {
      isPortal: true,
      word: idx("native_word"),
      english: idx("english_translation"),
      category: idx("category"),
      pronunciation: idx("pronunciation"),
      example: idx("example_sentence_native"),
      exampleTranslation: idx("example_sentence_english"),
      audioUrl: idx("audio_url"),
      contributorName: idx("contributor_name"),
      contributorId: idx("contributor_id"),
    };
  }
  return {
    isPortal: false,
    word: 0, english: 1, category: 2, pronunciation: 3, example: 4, exampleTranslation: 5,
    audioUrl: -1, contributorName: -1, contributorId: -1,
  };
}

function getField(fields, idx) {
  return idx >= 0 && idx < fields.length ? fields[idx] || "" : "";
}

function main() {
  const { inputFile, language, startId } = parseArgs(process.argv.slice(2));

  if (!inputFile) {
    console.error("Usage: node scripts/parse-vocabulary.js <input.csv> [--language=izon] [--start-id=403]");
    process.exit(1);
  }

  const content = fs.readFileSync(path.resolve(inputFile), "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());

  const headerLine = lines[0];
  const headerLower = headerLine.toLowerCase();
  const isPortal = headerLower.includes("native_word") || headerLower.includes("english_translation");
  const hasHeader = isPortal || (headerLower.includes("word") && headerLower.includes("english"));

  const colMap = hasHeader
    ? buildColMap(parseCsvLine(headerLine).map((f) => f.toLowerCase().trim()))
    : buildColMap([]);
  const dataLines = hasHeader ? lines.slice(1) : lines;

  if (isPortal) {
    console.error("Detected portal export format.");
  }

  const entries = [];
  const seen = new Set();
  let id = startId;

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCsvLine(dataLines[i]);
    const word = getField(fields, colMap.word);
    const english = getField(fields, colMap.english);
    const category = getField(fields, colMap.category);
    const pronunciation = getField(fields, colMap.pronunciation);
    const example = getField(fields, colMap.example);
    const exampleTranslation = getField(fields, colMap.exampleTranslation);
    const audioUrl = getField(fields, colMap.audioUrl);
    const contributorName = getField(fields, colMap.contributorName);
    const contributorId = getField(fields, colMap.contributorId);

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
    const hasAudio = !!audioUrl;
    const hasContrib = !!contributorName || !!contributorId;

    const parts = [`  e(${id}, ${JSON.stringify(word)}, ${JSON.stringify(english)}, ${JSON.stringify(validCat)}`];
    if (pronunciation) parts.push(`, ${JSON.stringify(pronunciation)}`);
    else if (example || exampleTranslation || hasAudio || hasContrib) parts.push(", undefined");
    if (example) parts.push(`, ${JSON.stringify(example)}`);
    else if (exampleTranslation || hasAudio || hasContrib) parts.push(", undefined");
    if (exampleTranslation) parts.push(`, ${JSON.stringify(exampleTranslation)}`);
    else if (hasAudio || hasContrib) parts.push(", undefined");
    if (audioUrl) parts.push(`, ${JSON.stringify(audioUrl)}`);
    else if (hasContrib) parts.push(", undefined");
    if (contributorName) parts.push(`, ${JSON.stringify(contributorName)}`);
    else if (contributorId) parts.push(", undefined");
    if (contributorId) parts.push(`, ${JSON.stringify(contributorId)}`);
    parts.push("),");

    entries.push(parts.join(""));
    id++;
  }

  // Output TypeScript
  console.log(`import type { DictionaryEntry, DictionaryCategory } from "@/lib/dictionary";`);
  console.log("");
  console.log(`function e(id: number, word: string, english: string, category: DictionaryCategory, pronunciation?: string, example?: string, exampleTranslation?: string, audioUrl?: string, contributorName?: string, contributorId?: string): DictionaryEntry {`);
  console.log(`  return { id: \`d\${id}\`, word, english, category, languageId: ${JSON.stringify(language)}, pronunciation, example, exampleTranslation, audioUrl, contributorName, contributorId };`);
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
