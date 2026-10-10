import { type ActivityEntry, ActivityTrace } from "@resilix/ui-chat";
import { Badge, Icon } from "@resilix/ui-components";
import type { useIncident } from "@/hooks/useIncident";
import type { ChatLabels } from "./chatLabels";
import styles from "./ResponseStyles.module.css";

export function ResponsePanel({
  controller,
  labels: l,
  language,
  traces,
  onNew,
}: {
  controller: ReturnType<typeof useIncident>;
  labels: ChatLabels;
  language: string;
  traces: ActivityEntry[];
  onNew: () => void;
}) {
  const { incident, incidents, busy } = controller;
  const statusLabel = (value: string) =>
    value in l ? l[value as keyof ChatLabels] : value;
  const entries: ActivityEntry[] = [
    ...(incident?.traces ?? []).map((entry) => ({
      id: entry.id,
      label: entry.type,
      status: `${l.revision} ${entry.revision}`,
      details: JSON.stringify(entry.data, null, 2),
      time: new Date(entry.created_at).toLocaleTimeString(language),
    })),
    ...traces.map((entry) => ({ ...entry, status: statusLabel(entry.status) })),
  ];
  const command = (action: "pause" | "resume" | "cancel") => {
    void controller.steer(l[action], action).catch(() => undefined);
  };
  return (
    <section className={styles.panel} aria-label={l.queue}>
      <header>
        <div>
          <Icon name="layers" />
          <strong>{l.responseMode}</strong>
        </div>
        <Badge tone="purple">{l.simulation}</Badge>
      </header>
      <p className={styles.notice}>{l.simulationHint}</p>
      {incidents.length > 0 && (
        <label className={styles.history}>
          {l.incidentSelect}
          <select
            value={incident?.id ?? ""}
            onChange={(event) => {
              void controller
                .inspect(event.target.value)
                .catch(() => undefined);
            }}
          >
            {incidents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {incident ? (
        <>
          <div className={styles.incidentTitle}>
            <h2>{incident.title}</h2>
            <span>
              {statusLabel(incident.status)} · {l.revision} {incident.revision}
            </span>
          </div>
          <div className={styles.progress}>
            <span>
              {
                incident.tasks.filter((task) => task.status === "completed")
                  .length
              }{" "}
              / {incident.tasks.length}
            </span>
            <strong>{l.queue}</strong>
          </div>
          <ol className={styles.tasks}>
            {incident.tasks.map((task) => (
              <li key={task.id} data-status={task.status}>
                <span className={styles.taskIcon}>
                  {task.status === "completed" ? (
                    <Icon name="check" width={14} />
                  ) : task.status === "running" ? (
                    <Icon name="refresh" width={14} />
                  ) : (
                    <Icon name="layers" width={14} />
                  )}
                </span>
                <div>
                  <strong>{l[task.role]}</strong>
                  <span>
                    {task.phase === "plan"
                      ? l.phasePlan
                      : task.phase === "review"
                        ? l.phaseReview
                        : task.phase === "response"
                          ? l.phaseResponse
                          : task.title}
                  </span>
                </div>
                <small>{statusLabel(task.status)}</small>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            {["running", "queued"].includes(incident.status) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => command("pause")}
              >
                {l.pause}
              </button>
            )}
            {incident.status === "paused" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => command("resume")}
              >
                {l.resume}
              </button>
            )}
            {!["completed", "cancelled", "failed"].includes(
              incident.status,
            ) && (
              <button
                type="button"
                disabled={busy}
                onClick={() => command("cancel")}
              >
                {l.cancel}
              </button>
            )}
            <button type="button" onClick={onNew}>
              {l.newIncident}
            </button>
          </div>
          <p className={styles.notice}>{l.steerHint}</p>
        </>
      ) : (
        <div className={styles.empty}>
          <Icon name="shield" width={27} />
          <p>{l.noTasks}</p>
          <button type="button" onClick={onNew}>
            {l.startIncident}
            <Icon name="arrow" width={14} />
          </button>
        </div>
      )}
      {entries.length > 0 && (
        <ActivityTrace
          entries={entries}
          label={l.activity}
          description={l.activityHint}
        />
      )}
    </section>
  );
}
