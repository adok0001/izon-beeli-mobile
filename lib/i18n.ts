import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { fr } from "./locales/fr";
import "./locales/index";

const i18n = i18next.createInstance();

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: "en",
  fallbackLng: "en",
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
