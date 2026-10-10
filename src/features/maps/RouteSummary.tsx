import { safeSource } from "@/lib/api/client";
import { useMapWorkspace } from "./MapWorkspaceProvider";
import { useMapMessages } from "./messages";
import styles from "./RoutePlannerStyles.module.css";
export function RouteSummary() {
  const { route } = useMapWorkspace();
  const { messages, language } = useMapMessages();
  if (!route) return null;
  const streetSteps = route.steps.filter((step) => step.name.trim());
  return (
    <section className={styles.result} aria-live="polite">
      <div className={styles.metrics}>
        <span>
          {messages.distance}
          <strong>
            {(route.distance_m / 1000).toLocaleString(language, {
              maximumFractionDigits: 2,
            })}{" "}
            km
          </strong>
        </span>
        <span>
          {messages.duration}
          <strong>{Math.ceil(route.duration_s / 60)} min</strong>
        </span>
      </div>
      <p>{messages.notAssessed}</p>
      <p className={styles.provenance}>
        {messages.providedBy} {route.provenance.provider} ·{" "}
        {new Date(route.generated_at).toLocaleTimeString(language)} ·{" "}
        <a
          href={safeSource(route.provenance.attribution_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {route.provenance.attribution}
        </a>
      </p>
      {streetSteps.length > 0 && (
        <details>
          <summary>{messages.steps}</summary>
          <ol>
            {streetSteps.map((step, index) => (
              <li key={`${index}-${step.name}`}>
                <span>{step.name}</span>
                <span>{Math.round(step.distance_m)} m</span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </section>
  );
}
