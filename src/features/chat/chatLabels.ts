import type { Language } from "@/lib/i18n/messages";
import de from "./labels/de.json";
import en from "./labels/en.json";
import es from "./labels/es.json";
import fr from "./labels/fr.json";
export type ChatLabels = typeof en;
export const chatLabels = { en, es, de, fr } satisfies Record<
  Language,
  ChatLabels
>;
