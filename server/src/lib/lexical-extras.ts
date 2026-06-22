/**
 * Parsing for the four "lexical enrichment" fields shared by the admin and
 * educator dictionary editors: synonyms, antonyms, semanticDomain, and
 * dialectalVariants. Each editor sends them either as a JSON body (real
 * arrays/objects) or as multipart form fields (JSON-stringified). This module
 * normalizes both into the shapes stored on `dictionary_entries`.
 */

export type DialectalVariant = { dialect: string; form: string; region?: string };

export interface LexicalExtras {
  synonyms: string[] | null;
  antonyms: string[] | null;
  semanticDomain: string | null;
  dialectalVariants: DialectalVariant[] | null;
}

/** Thrown when a caller-supplied lexical field is structurally invalid (→ HTTP 400). */
export class LexicalParseError extends Error {}

/** Parse a string[] from a JSON-string array, a real array, or a comma-separated string. */
function parseStringArray(raw: unknown): string[] | null {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    if (s.startsWith("[")) {
      try {
        arr = JSON.parse(s);
      } catch {
        throw new LexicalParseError("Expected a valid JSON array");
      }
    } else {
      arr = s.split(",");
    }
  }
  if (!Array.isArray(arr)) return null;
  const out = arr
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v): v is string => v.length > 0);
  return out.length ? out : null;
}

/** Parse dialectal variants from a JSON string or real array; reject malformed shapes. */
function parseVariants(raw: unknown): DialectalVariant[] | null {
  let arr: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    try {
      arr = JSON.parse(s);
    } catch {
      throw new LexicalParseError("dialectalVariants must be valid JSON");
    }
  }
  if (arr == null) return null;
  if (!Array.isArray(arr)) throw new LexicalParseError("dialectalVariants must be an array");

  const out: DialectalVariant[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) {
      throw new LexicalParseError("each dialectal variant must be an object");
    }
    const { dialect, form, region } = item as Record<string, unknown>;
    const d = typeof dialect === "string" ? dialect.trim() : "";
    const f = typeof form === "string" ? form.trim() : "";
    if (!d || !f) throw new LexicalParseError("each dialectal variant needs a dialect and a form");
    const r = typeof region === "string" && region.trim() ? region.trim() : undefined;
    out.push(r ? { dialect: d, form: f, region: r } : { dialect: d, form: f });
  }
  return out.length ? out : null;
}

/**
 * Build the lexical-extra columns from a request `fields` map, including only
 * keys that are actually present (so PATCH leaves unmentioned fields untouched
 * while still allowing an explicit empty value to clear a column).
 * Throws {@link LexicalParseError} on malformed input.
 */
export function parseLexicalExtras(fields: Record<string, unknown>): Partial<LexicalExtras> {
  const out: Partial<LexicalExtras> = {};
  if ("synonyms" in fields) out.synonyms = parseStringArray(fields.synonyms);
  if ("antonyms" in fields) out.antonyms = parseStringArray(fields.antonyms);
  if ("semanticDomain" in fields) {
    const s = typeof fields.semanticDomain === "string" ? fields.semanticDomain.trim() : "";
    out.semanticDomain = s || null;
  }
  if ("dialectalVariants" in fields) out.dialectalVariants = parseVariants(fields.dialectalVariants);
  return out;
}
