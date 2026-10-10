"use client";
import { StructuredCard } from "@resilix/ui-chat";
import { ActionButton, Badge } from "@resilix/ui-components";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { CardSchema, request } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./WorkflowStyles.module.css";
import { workflowLabels } from "./workflowLabels";

const WorkflowSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["proposed", "approved", "rejected"]),
  proposal: z.object({
    text: z.string(),
    cards: z.array(CardSchema),
    model: z.string().optional(),
  }),
  receipt: z.unknown().nullable(),
  created_at: z.string(),
  decided_at: z.string(),
  is_simulation: z.literal(true),
});
type Workflow = z.infer<typeof WorkflowSchema>;

export function WorkflowPanel() {
  const { language, t: translate } = usePreferences();
  const t = workflowLabels[language];
  const [items, setItems] = useState<Workflow[]>([]);
  const [busy, setBusy] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<MessageKey | "">("");
  const [loaded, setLoaded] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await request(
        "workflows",
        z.object({ workflows: z.array(WorkflowSchema) }),
      );
      setItems(result.workflows);
      setLoaded(true);
      setError("");
    } catch (reason) {
      setError(apiErrorKey(reason));
    }
  }, []);
  useEffect(() => {
    void refresh();
    const url = new URL("/api/events", window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        const value: unknown = JSON.parse(event.data);
        if (
          z
            .object({ type: z.string() })
            .parse(value)
            .type.startsWith("workflow.")
        )
          void refresh();
      } catch {
        /* Unrecognized events cannot mutate the view. */
      }
    };
    socket.onerror = () => setError("networkError");
    return () => socket.close();
  }, [refresh]);
  const create = async (event: FormEvent) => {
    event.preventDefault();
    setBusy("create");
    setError("");
    try {
      await request("workflows", z.object({ workflow: WorkflowSchema }), {
        title,
        description,
        language,
      });
      setTitle("");
      setDescription("");
      await refresh();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy("");
    }
  };
  const decide = async (id: string, decision: "approve" | "reject") => {
    setBusy(id);
    setError("");
    try {
      await request(
        `workflows/${encodeURIComponent(id)}/decision`,
        z.object({ workflow: WorkflowSchema }),
        { decision },
      );
      await refresh();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setBusy("");
    }
  };
  return (
    <section className={styles.workspace}>
      <header className={styles.heading}>
        <Badge tone="purple">{t.simulation}</Badge>
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>
      <p className={styles.boundary}>{t.boundary}</p>
      {error && (
        <p className={styles.error} role="alert">
          {translate(error)} {t.error}
        </p>
      )}
      <div className={styles.columns}>
        <form onSubmit={create} className={styles.form}>
          <h2>{t.form}</h2>
          <label>
            {t.name}
            <input
              required
              maxLength={180}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            {t.context}
            <textarea
              required
              maxLength={6000}
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <p>{t.hint}</p>
          <ActionButton type="submit" variant="accent" disabled={Boolean(busy)}>
            {busy === "create" ? t.working : t.create}
          </ActionButton>
        </form>
        <div className={styles.plans} aria-live="polite">
          <div className={styles.toolbar}>
            <ActionButton
              compact
              variant="ghost"
              onClick={() => void refresh()}
            >
              {t.refresh}
            </ActionButton>
          </div>
          {!loaded && <p>{t.loading}</p>}
          {loaded && items.length === 0 && (
            <p className={styles.empty}>{t.empty}</p>
          )}
          {items.map((item) => (
            <article className={styles.plan} key={item.id}>
              <div className={styles.planHead}>
                <h2>{item.title}</h2>
                <Badge
                  tone={
                    item.status === "approved"
                      ? "lime"
                      : item.status === "rejected"
                        ? "neutral"
                        : "warning"
                  }
                >
                  {t[item.status]}
                </Badge>
              </div>
              <p>{item.proposal.text}</p>
              <div className={styles.cards}>
                {item.proposal.cards.map((card, i) => (
                  <StructuredCard
                    key={`${item.id}-${i}`}
                    card={card}
                    sourceLabel={t.source}
                  />
                ))}
              </div>
              <p className={styles.meta}>
                {new Date(item.created_at).toLocaleString(language)} · {t.model}
                : {item.proposal.model}
              </p>
              {item.status === "proposed" ? (
                <div className={styles.actions}>
                  <ActionButton
                    variant="accent"
                    disabled={Boolean(busy)}
                    onClick={() => void decide(item.id, "approve")}
                  >
                    {t.approve}
                  </ActionButton>
                  <ActionButton
                    variant="ghost"
                    disabled={Boolean(busy)}
                    onClick={() => void decide(item.id, "reject")}
                  >
                    {t.reject}
                  </ActionButton>
                </div>
              ) : (
                <div className={styles.receipt}>
                  <strong>{t.receipt}</strong>
                  <p>
                    {item.status === "approved" ? t.completed : t.notExecuted}
                  </p>
                  <small>
                    {new Date(item.decided_at).toLocaleString(language)}
                  </small>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
