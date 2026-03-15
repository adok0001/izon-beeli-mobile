#!/usr/bin/env node
/**
 * Parse a LESSON.csv into a TypeScript Lesson object.
 *
 * Usage:
 *   node scripts/parse-lesson.js <input.csv> [--lesson-id=lesson-45]
 *
 * CSV format:
 *   Header section (key,value pairs) above "---"
 *   Transcript section (text,translation,startTime,endTime) below "---"
 */

const fs = require("fs");
const path = require("path");

function parseArgs(args) {
  const opts = { lessonId: "lesson-new" };
  let inputFile = null;

  for (const arg of args) {
    if (arg.startsWith("--lesson-id=")) {
      opts.lessonId = arg.split("=")[1];
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
  const { inputFile, lessonId } = parseArgs(process.argv.slice(2));

  if (!inputFile) {
    console.error("Usage: node scripts/parse-lesson.js <input.csv> [--lesson-id=lesson-45]");
    process.exit(1);
  }

  const content = fs.readFileSync(path.resolve(inputFile), "utf-8");
  const lines = content.split(/\r?\n/);

  // Find separator
  const separatorIdx = lines.findIndex((l) => l.trim() === "---");
  if (separatorIdx === -1) {
    console.error("Error: No '---' separator found. Expected header section above '---' and transcript below.");
    process.exit(1);
  }

  // Parse header section
  const headerLines = lines.slice(0, separatorIdx).filter((l) => l.trim());
  const meta = {};
  for (const line of headerLines) {
    const fields = parseCsvLine(line);
    if (fields.length >= 2) {
      meta[fields[0].toLowerCase()] = fields[1];
    }
  }

  // Parse transcript section
  const transcriptLines = lines.slice(separatorIdx + 1).filter((l) => l.trim());
  // Skip header row if present
  const firstLine = transcriptLines[0]?.toLowerCase() || "";
  const dataLines = firstLine.includes("text") && firstLine.includes("translation")
    ? transcriptLines.slice(1)
    : transcriptLines;

  const segments = [];
  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCsvLine(dataLines[i]);
    const [text, translation, startTimeStr, endTimeStr] = fields;

    if (!text) continue;

    const startTime = parseFloat(startTimeStr) || 0;
    const endTime = parseFloat(endTimeStr) || 0;

    segments.push({
      id: `t${lessonId.replace("lesson-", "")}-${i + 1}`,
      startTime,
      endTime,
      text,
      translation: translation || undefined,
    });
  }

  // Output TypeScript
  const audioUrl = meta.audiourl || meta.audioUrl || "";
  const title = meta.title || "Untitled Lesson";
  const description = meta.description || "";
  const courseId = meta.courseid || meta.courseId || "course-unknown";

  console.log(`// Lesson: ${title}`);
  console.log(`{`);
  console.log(`  id: ${JSON.stringify(lessonId)},`);
  console.log(`  courseId: ${JSON.stringify(courseId)},`);
  console.log(`  title: ${JSON.stringify(title)},`);
  console.log(`  description: ${JSON.stringify(description)},`);
  if (audioUrl) {
    console.log(`  audioUrl: ${JSON.stringify(audioUrl)},`);
  }
  console.log(`  order: 1,`);
  console.log(`  completed: false,`);
  console.log(`  transcript: [`);
  for (const seg of segments) {
    const parts = [
      `    { id: ${JSON.stringify(seg.id)}`,
      `, startTime: ${seg.startTime}`,
      `, endTime: ${seg.endTime}`,
      `, text: ${JSON.stringify(seg.text)}`,
    ];
    if (seg.translation) {
      parts.push(`, translation: ${JSON.stringify(seg.translation)}`);
    }
    parts.push(` },`);
    console.log(parts.join(""));
  }
  console.log(`  ],`);
  console.log(`}`);

  console.error(`\n✓ Parsed lesson "${title}" with ${segments.length} transcript segments`);
}

main();
