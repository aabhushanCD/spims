import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ne from "./locales/ne.json";

export const LANGUAGE_STORAGE_KEY = "spims-language";

export const SUPPORTED_LANGUAGES = ["en", "ne"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value?.startsWith("ne") ? "ne" : "en";
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ne: { translation: ne },
    },
    fallbackLng: "en",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

i18n.on("languageChanged", (language) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = normalizeLanguage(language);
  }
});

if (typeof document !== "undefined") {
  document.documentElement.lang = normalizeLanguage(i18n.language);
}

export { i18n };
export default i18n;
