/**
 * Translatable text fields are stored as a `<field>Translations` jsonb map
 * ({ en, fr, pcm, ar, pt, ... }) plus a flat `<field>` column holding the
 * English projection. The flat column stays because it is `notNull` on most
 * tables, is what SQL/CSV consumers read, and is the fallback when a row has no
 * gloss for the requested language.
 *
 * Rows written before the map columns existed have `<field>Translations === null`.
 * `hydrate()` synthesizes a map from the flat column for those, so clients never
 * have to branch on legacy shape.
 *
 * This replaced the `<field>` / `<field>Fr` pair, which could only ever hold two
 * languages.
 */

export type TranslationMap = Record<string, string>;

/**
 * Normalize an incoming translations map. Accepts an object (JSON body) or a
 * JSON-stringified object (multipart field). Returns a trimmed { lang: text }
 * map, or undefined when there is nothing usable.
 */
export function parseMap(raw: unknown): TranslationMap | undefined {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return undefined;
    try {
      obj = JSON.parse(s);
    } catch {
      return undefined;
    }
  }
  if (typeof obj !== "object" || obj === null) return undefined;
  const out: TranslationMap = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

/** Build a single-language map from a plain English string. */
export function toMap(en?: string | null): TranslationMap | undefined {
  return en?.trim() ? { en: en.trim() } : undefined;
}

/**
 * The flat-column projection of a map: its English gloss, falling back to the
 * first non-empty value so a map with no `en` still writes something readable.
 */
export function project(map: TranslationMap | undefined | null, fallback = ""): string {
  if (!map) return fallback;
  return map.en ?? Object.values(map).find(Boolean) ?? fallback;
}

/**
 * Resolve a map (or legacy flat string) to one language, mirroring the client's
 * `localize()`: requested lang → en → first available → fallback.
 */
export function localize(
  map: TranslationMap | null | undefined,
  lang: string,
  fallback = "",
): string {
  if (!map) return fallback;
  return map[lang] ?? map.en ?? Object.values(map).find(Boolean) ?? fallback;
}

/**
 * Rewrite every gloss in a map, keeping its languages. Use when server-generated
 * copy wraps a translated fragment ("Reached Level 3: {title}") and the wrapper
 * itself differs per language.
 */
export function mapValues(
  map: TranslationMap,
  fn: (value: string, lang: string) => string,
): TranslationMap {
  return Object.fromEntries(Object.entries(map).map(([lang, v]) => [lang, fn(v, lang)]));
}

/**
 * Resolve the incoming value for one translatable field. An explicit map wins;
 * a client that only sends the flat English field still gets a valid map.
 */
export function resolveMap(map: unknown, flat?: string | null): TranslationMap | undefined {
  return parseMap(map) ?? toMap(flat);
}

/**
 * PATCH counterpart of `resolveMap`: writes the `<field>` / `<field>Translations`
 * column pair into `updates`, but only when the request actually mentioned the
 * field. Sending either key empty clears both columns when `nullable` is set —
 * on `notNull` columns (title, description) an empty value is ignored instead.
 */
export function applyMap(
  updates: object,
  body: object,
  flatKey: string,
  mapKey: string,
  { nullable = false }: { nullable?: boolean } = {},
): void {
  const src = body as Record<string, unknown>;
  const dest = updates as Record<string, unknown>;
  if (!(mapKey in src) && !(flatKey in src)) return;
  const map = resolveMap(src[mapKey], src[flatKey] as string | null | undefined);
  if (map) {
    dest[mapKey] = map;
    dest[flatKey] = project(map);
  } else if (nullable) {
    dest[mapKey] = null;
    dest[flatKey] = null;
  }
}

/**
 * Guarantee every named map field on a row is populated, synthesizing
 * `{ en: row[flatKey] }` for rows that predate the map column.
 *
 * hydrate(course, ["title", "titleTranslations"], ["description", "descriptionTranslations"])
 */
export function hydrate<T extends Record<string, unknown>>(
  row: T,
  ...fields: [flatKey: keyof T & string, mapKey: keyof T & string][]
): T {
  const out = { ...row };
  for (const [flatKey, mapKey] of fields) {
    if (out[mapKey]) continue;
    const flat = out[flatKey];
    const map = typeof flat === "string" ? toMap(flat) : undefined;
    if (map) (out as Record<string, unknown>)[mapKey] = map;
  }
  return out;
}
