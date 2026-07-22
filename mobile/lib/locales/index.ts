import type { ParseKeys } from "i18next";
import type { en } from "./en";

export type TranslationResources = typeof en;

/**
 * Every valid dot-path into the translation tree, e.g. "feed.title".
 *
 * Type config-object key fields as this rather than `string` — that is what lets
 * `t(config.titleKey)` typecheck without a cast, and what makes a renamed key a
 * compile error instead of a raw dot-path leaking into the UI.
 */
export type TranslationKey = ParseKeys<"translation">;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: TranslationResources };
  }
}
