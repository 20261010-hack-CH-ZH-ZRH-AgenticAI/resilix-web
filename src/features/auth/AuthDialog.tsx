"use client";
import { ActionButton, Icon } from "@resilix/ui-components";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { Brand } from "@/features/shell/Brand";
import { authenticate, type User } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./AuthStyles.module.css";
export function AuthDialog({
  open,
  onClose,
  onUser,
}: {
  open: boolean;
  onClose: () => void;
  onUser: (user: User) => void;
}) {
  const { t } = usePreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    try {
      const user = await authenticate(register ? "register" : "login", {
        email: fields.get("email"),
        password: fields.get("password"),
        ...(register ? { name: fields.get("name") } : {}),
      });
      onUser(user);
      onClose();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy(false);
    }
  }
  async function demo() {
    setBusy(true);
    setError("");
    try {
      onUser(await authenticate("demo"));
      onClose();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      onCancel={onClose}
      aria-labelledby="auth-title"
    >
      <div className={styles.top}>
        <Brand />
        <ActionButton
          compact
          variant="ghost"
          onClick={onClose}
          title={t("close")}
          aria-label={t("close")}
        >
          <Icon name="close" />
        </ActionButton>
      </div>
      <h1 id="auth-title">{t(register ? "createAccount" : "welcome")}</h1>
      <p className={styles.subtitle}>{t("authBody")}</p>
      {error && (
        <p role="alert" className={styles.error}>
          {t(error)}
        </p>
      )}
      <form onSubmit={submit} className={styles.form}>
        {register && (
          <label>
            {t("name")}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
            />
          </label>
        )}
        <label>
          {t("email")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          {t("password")}
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={register ? 12 : 1}
            maxLength={200}
          />
          {register && <span>{t("passwordHint")}</span>}
        </label>
        <ActionButton type="submit" disabled={busy}>
          {t(busy ? "loading" : register ? "register" : "signIn")}
          <Icon name="arrow" />
        </ActionButton>
      </form>
      <div className={styles.divider}>
        <span>{t("or")}</span>
      </div>
      <ActionButton variant="accent" onClick={demo} disabled={busy}>
        {t("demo")}
        <Icon name="spark" />
      </ActionButton>
      <p className={styles.note}>{t("demoExplain")}</p>
      <p className={styles.switch}>
        {t(register ? "haveAccount" : "noAccount")}{" "}
        <button
          type="button"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {t(register ? "signIn" : "register")}
        </button>
      </p>
    </dialog>
  );
}
