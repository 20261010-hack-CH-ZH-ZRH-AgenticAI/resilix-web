"use client";
import { Icon } from "@resilix/ui-components";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./ChatStyles.module.css";
export function ChatEmptyState({
  onPick,
}: {
  onPick: (value: string) => void;
}) {
  const { t } = usePreferences();
  return (
    <div className={styles.empty}>
      <div className={styles.mark}>
        <Icon name="spark" width={38} height={38} />
      </div>
      <div className={styles.eyebrow}>{t("welcomeChip")}</div>
      <h1>{t("chatHello")}</h1>
      <p>{t("chatBody")}</p>
      <div className={styles.suggestions}>
        {(["prompt1", "prompt2", "prompt3"] as const).map((key, index) => (
          <button
            type="button"
            key={key}
            onClick={() => {
              onPick(t(key));
            }}
          >
            <Icon
              name={index === 0 ? "mountain" : index === 1 ? "shield" : "grid"}
            />
            <strong>
              {t(index === 0 ? "prepare" : index === 1 ? "understand" : "plan")}
            </strong>
            <span>{t(key)}</span>
            <Icon name="arrow" width={15} />
          </button>
        ))}
      </div>
    </div>
  );
}
