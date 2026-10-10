"use client";
import { ActionButton, Badge, Icon } from "@resilix/ui-components";
import { type Alert, safeSource } from "@/lib/api/client";
import { usePreferences } from "@/lib/i18n/Provider";
import alertStyles from "./AlertStyles.module.css";
import baseStyles from "./DashboardStyles.module.css";

const styles = { ...baseStyles, ...alertStyles };
export function AlertList({
  alerts,
  personal = false,
  onSelect,
  selected,
  onCreate,
}: {
  alerts: Alert[];
  personal?: boolean;
  onSelect: (id: string) => void;
  selected?: string;
  onCreate?: () => void;
}) {
  const { t, language } = usePreferences();
  if (!alerts.length)
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <Icon name={personal ? "lock" : "shield"} width={28} height={28} />
        </div>
        <h3>{t(personal ? "noPrivate" : "noPublic")}</h3>
        <p>{t(personal ? "noPrivateBody" : "noPublicBody")}</p>
        {personal && onCreate && (
          <ActionButton variant="ghost" onClick={onCreate}>
            <Icon name="plus" />
            {t("createAlert")}
          </ActionButton>
        )}
      </div>
    );
  return (
    <div className={styles.alertList}>
      {alerts.map((alert) => (
        <button
          type="button"
          key={alert.id}
          onClick={() => onSelect(alert.id)}
          className={`${styles.alertRow} ${selected === alert.id ? styles.selected : ""}`}
        >
          <span
            className={`${styles.alertIcon} ${alert.visibility === "personal" ? styles.privateIcon : ""}`}
          >
            <Icon name={alert.visibility === "personal" ? "lock" : "bell"} />
          </span>
          <span className={styles.alertContent}>
            <span className={styles.alertTitle}>{alert.title}</span>
            <span className={styles.alertMeta}>
              {alert.location || alert.source_name || t("personal")}
              {alert.observed_at &&
                ` · ${new Date(alert.observed_at).toLocaleDateString(language, { day: "numeric", month: "short" })}`}
            </span>
          </span>
          <Badge
            tone={
              alert.visibility === "personal"
                ? "purple"
                : alert.is_simulation
                  ? "warning"
                  : "neutral"
            }
          >
            {t(
              alert.visibility === "personal"
                ? "personal"
                : alert.is_simulation
                  ? "simulation"
                  : "liveData",
            )}
          </Badge>
          <Icon name="chevron" width={15} />
        </button>
      ))}
    </div>
  );
}
export function AlertDetails({
  alert,
  onClose,
  onAsk,
  onDelete,
}: {
  alert: Alert;
  onClose: () => void;
  onAsk: (alert: Alert) => void;
  onDelete?: (id: string) => void;
}) {
  const { t, language } = usePreferences();
  const source = safeSource(alert.source_url);
  return (
    <article className={styles.detail}>
      <div className={styles.panelTitle}>
        <span>{t("selectedReport")}</span>
        <ActionButton
          compact
          variant="ghost"
          onClick={onClose}
          aria-label={t("close")}
        >
          <Icon name="close" width={16} />
        </ActionButton>
      </div>
      <Badge
        tone={
          alert.visibility === "personal"
            ? "purple"
            : alert.is_simulation
              ? "warning"
              : "lime"
        }
      >
        {t(
          alert.visibility === "personal"
            ? "personal"
            : alert.is_simulation
              ? "simulation"
              : "liveData",
        )}
      </Badge>
      <h2>{alert.title}</h2>
      <p>{alert.description}</p>
      <div className={styles.detailMeta}>
        <span>
          <Icon name="pin" width={15} />
          {alert.location || "—"}
        </span>
        <span>
          {alert.observed_at
            ? new Date(alert.observed_at).toLocaleString(language)
            : t("unknownTime")}
        </span>
      </div>
      {source && (
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.sourceLink}
        >
          {alert.source_name || t("source")}
          <Icon name="external" width={14} />
        </a>
      )}
      <div className={styles.detailActions}>
        <ActionButton variant="accent" onClick={() => onAsk(alert)}>
          <Icon name="spark" />
          {t("askAI")}
        </ActionButton>
        {alert.visibility === "personal" && onDelete && (
          <ActionButton
            compact
            variant="danger"
            aria-label={t("delete")}
            title={t("delete")}
            onClick={() => {
              if (confirm(t("confirmDelete"))) onDelete(alert.id);
            }}
          >
            <Icon name="trash" />
          </ActionButton>
        )}
      </div>
    </article>
  );
}
