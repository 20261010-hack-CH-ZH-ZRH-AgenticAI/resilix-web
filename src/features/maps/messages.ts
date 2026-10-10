import type { MapLabels } from "@resilix/ui-canvas";
import { usePreferences } from "@/lib/i18n/Provider";
import de from "./messages/de.json";
import en from "./messages/en.json";
import es from "./messages/es.json";
import fr from "./messages/fr.json";
export type MapMessageKey = keyof typeof en;
export type MapMessages = Record<MapMessageKey, string>;
export const mapMessages: Record<"en" | "es" | "de" | "fr", MapMessages> = {
  en,
  es,
  de,
  fr,
};
export function useMapMessages() {
  const { language, t } = usePreferences();
  const messages = mapMessages[language];
  const labels: MapLabels = {
    ...messages,
    zoomIn: t("zoomIn"),
    zoomOut: t("zoomOut"),
    reset: t("resetMap"),
    unavailable: t("mapUnavailable"),
    map: t("liveMap"),
  };
  return { messages, labels, language };
}
