import type { TFunction } from "i18next";
import type { TranslationKey } from "./locales";

/**
 * Translates a static key with a runtime-assembled interpolation bag.
 *
 * i18next derives a per-key interpolation shape from the locale tree, so a
 * generic `Record<string, unknown>` of variables is never assignable — even
 * when the variables are correct. This is the one sanctioned place to loosen
 * that check, and it loosens only the *variables*: `key` stays fully typed, so
 * a renamed or deleted translation is still a compile error at every call site.
 *
 * Do not reach for this to pass a dynamic key. If a key isn't statically known,
 * type its source as `TranslationKey` (see lib/locales/index.ts) or use a
 * lookup table — both are checked, and both catch drift that this would hide.
 */
export function tWithVars(
  t: TFunction,
  key: TranslationKey,
  vars?: Record<string, unknown>,
): string {
  // One cast, on the function rather than the arguments, so `key` keeps its
  // checked type at the parameter and the result stays a plain string.
  const translate = t as unknown as (k: TranslationKey, v?: Record<string, unknown>) => string;
  return translate(key, vars);
}
