"use client";
import { ActionButton, Icon } from "@resilix/ui-components";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { createAlert } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import alertStyles from "./AlertStyles.module.css";
import baseStyles from "./DashboardStyles.module.css";

const styles = { ...baseStyles, ...alertStyles };
export function PersonalAlertDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = usePreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  const [coords, setCoords] = useState<[number, number]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      setCoords(undefined);
      setError("");
    } else dialog.current?.close();
  }, [open]);
  const locate = () =>
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords([position.coords.latitude, position.coords.longitude]);
        setError("");
      },
      () => setError("locationError"),
      { enableHighAccuracy: false, timeout: 10_000 },
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      await createAlert({
        title: fields.get("title"),
        description: fields.get("description"),
        location: fields.get("location"),
        severity: fields.get("severity"),
        category: "observation",
        ...(coords ? { latitude: coords[0], longitude: coords[1] } : {}),
      });
      onCreated();
      onClose();
      event.currentTarget?.reset();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      className={styles.dialog}
      ref={dialog}
      onCancel={onClose}
      aria-labelledby="alert-title"
    >
      <div className={styles.panelTitle}>
        <Icon name="lock" />
        <ActionButton
          compact
          variant="ghost"
          aria-label={t("close")}
          onClick={onClose}
        >
          <Icon name="close" />
        </ActionButton>
      </div>
      <h2 id="alert-title">{t("createAlert")}</h2>
      <p className={styles.dialogNote}>{t("privateNotice")}</p>
      {error && (
        <p role="alert" className={styles.error}>
          {t(error)}
        </p>
      )}
      <form onSubmit={submit} className={styles.form}>
        <label>
          {t("title")}
          <input name="title" required minLength={3} maxLength={160} />
        </label>
        <label>
          {t("description")}
          <textarea name="description" required rows={3} maxLength={3000} />
        </label>
        <label>
          {t("location")}
          <input
            name="location"
            placeholder={t("locationHint")}
            maxLength={160}
          />
        </label>
        <ActionButton variant="ghost" onClick={locate}>
          <Icon name="pin" />
          {t(coords ? "locationSet" : "useLocation")}
        </ActionButton>
        <label>
          {t("severity")}
          <select name="severity" defaultValue="low">
            {(["low", "medium", "high", "critical"] as const).map((level) => (
              <option
                value={level === "medium" ? "moderate" : level}
                key={level}
              >
                {t(level)}
              </option>
            ))}
          </select>
        </label>
        <ActionButton type="submit" variant="accent" disabled={busy}>
          <Icon name="lock" />
          {t(busy ? "loading" : "save")}
        </ActionButton>
      </form>
    </dialog>
  );
}
