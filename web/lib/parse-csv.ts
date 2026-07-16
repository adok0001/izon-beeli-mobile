/**
 * Quote-aware CSV parser shared by the Studio bulk-import panels.
 *
 * Handles the cases the old naive `split(",")` in the contribute page could not:
 * double-quoted fields, commas inside quotes (e.g. `"Ama, fun kọn bo!"`), escaped
 * quotes (`""`), and CRLF line endings. Returns one object per data row, keyed by
 * the (trimmed) header names, so callers can map columns to entry fields.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const rows = parseRows(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== "")) // drop blank lines
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
}

/** Tokenize CSV text into a matrix of raw string cells. */
function parseRows(text: string): string[][] {
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Derive a stable, collision-resistant slug from a word — used to synthesize a
 * deterministic id for CSV dictionary rows that omit an explicit id, so
 * re-importing the same sheet upserts instead of duplicating. Subdot vowels
 * (ẹ/ị/ọ/ụ) decompose to their base letter under NFKD.
 */
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (subdots → base letter)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
