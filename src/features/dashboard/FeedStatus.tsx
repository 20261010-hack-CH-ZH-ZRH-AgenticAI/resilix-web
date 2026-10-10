import { Badge, Icon } from "@resilix/ui-components";
import type { Feed } from "@/lib/api/client";
import { usePreferences } from "@/lib/i18n/Provider";
import styles from "./FeedStatusStyles.module.css";
export function FeedStatus({ feed }: { feed?: Feed }) {
  const { t, language } = usePreferences();
  return (
    <details className={styles.feed} open={feed?.status !== "live"}>
      <summary>
        <Icon name="globe" width={15} />
        {t("sourceHealth")}
        <span>
          {feed
            ? `${feed.sources.filter((source) => source.status === "live").length}/${feed.sources.length}`
            : "—"}
        </span>
      </summary>
      <div className={styles.sources}>
        {!feed && <p>{t("sourceNotChecked")}</p>}
        {feed?.sources.map((source) => (
          <div key={source.source}>
            <strong>{source.source}</strong>
            <Badge tone={source.status === "live" ? "neutral" : "warning"}>
              {t(source.status === "live" ? "sourceLive" : "sourceStale")}
            </Badge>
            <p>
              {source.source === "USGS"
                ? t("usgsCoverage")
                : source.source === "MeteoSwiss"
                  ? t("swissCoverage")
                  : source.scope}
            </p>
            <span>
              {source.checked_at
                ? new Date(source.checked_at).toLocaleString(language)
                : t("unknownTime")}
            </span>
          </div>
        ))}
      </div>
    </details>
  );
}
