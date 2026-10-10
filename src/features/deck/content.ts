import type { Language } from "@/lib/i18n/messages";
import de from "./de.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";
export interface Slide {
  label: string;
  title: string;
  body: string;
  points: string[];
  footnote: string;
  kind: string;
  accent?: boolean;
}
const slides = { en, es, de, fr } satisfies Record<Language, Slide[]>;
export function slidesFor(language: Language): Slide[] {
  return slides[language];
}
export const deckLabels = {
  en: {
    previous: "Previous slide",
    next: "Next slide",
    print: "Print slides",
    fullscreen: "Full screen",
    slide: "Slide",
  },
  es: {
    previous: "Diapositiva anterior",
    next: "Siguiente diapositiva",
    print: "Imprimir diapositivas",
    fullscreen: "Pantalla completa",
    slide: "Diapositiva",
  },
  de: {
    previous: "Vorherige Folie",
    next: "Nächste Folie",
    print: "Folien drucken",
    fullscreen: "Vollbild",
    slide: "Folie",
  },
  fr: {
    previous: "Diapositive précédente",
    next: "Diapositive suivante",
    print: "Imprimer",
    fullscreen: "Plein écran",
    slide: "Diapositive",
  },
};
