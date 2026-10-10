"use client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type Language,
  languages,
  type MessageKey,
  messages,
} from "./messages";

interface Preferences {
  language: Language;
  setLanguage: (value: Language) => void;
  dark: boolean;
  toggleTheme: () => void;
  t: (key: MessageKey) => string;
}
const Context = createContext<Preferences | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("resilix.language");
    if (languages.includes(saved as Language))
      setLanguageState(saved as Language);
    setDark(
      localStorage.getItem("resilix.theme") === "dark" ||
        (!localStorage.getItem("resilix.theme") &&
          matchMedia("(prefers-color-scheme: dark)").matches),
    );
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.lang = language;
  }, [dark, language]);
  const setLanguage = (value: Language) => {
    setLanguageState(value);
    localStorage.setItem("resilix.language", value);
  };
  const toggleTheme = () =>
    setDark((value) => {
      localStorage.setItem("resilix.theme", value ? "light" : "dark");
      return !value;
    });
  const t = useCallback(
    (key: MessageKey) => messages[key][languages.indexOf(language)],
    [language],
  );
  return (
    <Context.Provider value={{ language, setLanguage, dark, toggleTheme, t }}>
      {children}
    </Context.Provider>
  );
}
export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error("PreferencesProvider required");
  return value;
}
