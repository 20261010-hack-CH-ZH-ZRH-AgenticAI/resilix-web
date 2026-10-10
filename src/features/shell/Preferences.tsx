"use client";
import { ActionButton, Icon } from "@resilix/ui-components";
import { type Language, languages } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./ShellStyles.module.css";
export function Preferences() {
  const { language, setLanguage, dark, toggleTheme, t } = usePreferences();
  return (
    <div className={styles.preferences}>
      <select
        aria-label={t("language")}
        title={t("language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as Language)}
      >
        {languages.map((value) => (
          <option key={value} value={value}>
            {value.toUpperCase()}
          </option>
        ))}
      </select>
      <ActionButton
        variant="ghost"
        compact
        onClick={toggleTheme}
        title={t(dark ? "light" : "dark")}
        aria-label={t(dark ? "light" : "dark")}
      >
        <Icon name={dark ? "sun" : "moon"} />
      </ActionButton>
    </div>
  );
}
