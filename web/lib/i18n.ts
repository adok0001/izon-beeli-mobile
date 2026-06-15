import { ar } from "@mobile/lib/locales/ar";
import { en } from "@mobile/lib/locales/en";
import { fr } from "@mobile/lib/locales/fr";
import { pcm } from "@mobile/lib/locales/pcm";
import { pt } from "@mobile/lib/locales/pt";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Create a web-local i18n instance so the type resolves against this
// package's i18next version, avoiding the monorepo version-mismatch error.
const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    pcm: { translation: pcm },
    ar: { translation: ar },
    pt: { translation: pt },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
