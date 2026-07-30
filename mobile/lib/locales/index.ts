import type { ParseKeys } from "i18next";
import type { TranslationResources } from "./keys";

export type { TranslationResources } from "./keys";

/**
 * Every valid dot-path into the translation tree, e.g. "feed.title".
 *
 * Type config-object key fields as this rather than `string` — that is what lets
 * `t(config.titleKey)` typecheck without a cast, and what makes a renamed key a
 * compile error instead of a raw dot-path leaking into the UI.
 *
 * Still i18next's `ParseKeys` here, so the app keeps whatever plural and context
 * handling i18next applies. `./keys` derives the same union without i18next, for
 * `web/`, which cannot resolve it — see the note there.
 */
export type TranslationKey = ParseKeys<"translation">;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: TranslationResources };
  }
}
