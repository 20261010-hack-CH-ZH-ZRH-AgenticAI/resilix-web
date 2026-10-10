import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
export const languages = ["en", "es", "de", "fr"] as const;
export type Language = (typeof languages)[number];
export type MessageKey = keyof typeof en;
export const translations = { en, es, de, fr } satisfies Record<
  Language,
  Record<MessageKey, string>
>;
export const messages = Object.fromEntries(
  (Object.keys(en) as MessageKey[]).map((key) => [
    key,
    languages.map((language) => translations[language][key]),
  ]),
) as Record<MessageKey, [string, string, string, string]>;
