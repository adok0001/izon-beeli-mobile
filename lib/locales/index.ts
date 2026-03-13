import type { en } from "./en";

export type TranslationResources = typeof en;

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: TranslationResources };
  }
}
