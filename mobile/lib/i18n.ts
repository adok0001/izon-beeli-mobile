import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { ar } from "./locales/ar";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { pcm } from "./locales/pcm";
import { pt } from "./locales/pt";
import "./locales/index";

const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
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
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
