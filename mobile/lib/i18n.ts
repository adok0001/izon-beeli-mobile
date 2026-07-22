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

// Journal strings added at the screen level (locale dictionaries in ./locales
// are owned separately); registered here with full parallel translations.
const journalExtras: Record<string, Record<string, string>> = {
  en: {
    "journal.privateNotice": "Your entries are private.",
    "journal.discardRecordingBody": "Your unsaved recording will be lost.",
  },
  fr: {
    "journal.privateNotice": "Vos entrées sont privées.",
    "journal.discardRecordingBody": "Votre enregistrement non sauvegardé sera perdu.",
  },
  pcm: {
    "journal.privateNotice": "Na only you fit see your entries.",
    "journal.discardRecordingBody": "Recording wey you never save go loss.",
  },
  ar: {
    "journal.privateNotice": "مدوّناتك خاصة بك.",
    "journal.discardRecordingBody": "سيتم فقدان تسجيلك غير المحفوظ.",
  },
  pt: {
    "journal.privateNotice": "Suas entradas são privadas.",
    "journal.discardRecordingBody": "Sua gravação não salva será perdida.",
  },
};
for (const [lng, resourcesForLng] of Object.entries(journalExtras)) {
  i18n.addResources(lng, "translation", resourcesForLng);
}

export default i18n;
