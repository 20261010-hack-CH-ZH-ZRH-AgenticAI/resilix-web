"use client";
import { ActionButton, Badge, Icon, MetricCard } from "@resilix/ui-components";
import { useState } from "react";
import { MapScene } from "@/features/maps/MapScene";
import { RoutePlanner } from "@/features/maps/RoutePlanner";
import type { Alert, Feed, Model, PublicConfig } from "@/lib/api/client";
import { usePreferences } from "@/lib/i18n/Provider";
import { AlertDetails, AlertList } from "./AlertList";
import alertStyles from "./AlertStyles.module.css";
import baseStyles from "./DashboardStyles.module.css";

const styles = { ...baseStyles, ...alertStyles };

import { FeedStatus } from "./FeedStatus";
export interface DashboardProps {
  view: "overview" | "map" | "alerts";
  alerts: Alert[];
  personal: Alert[];
  models: Model[];
  config: PublicConfig;
  updated?: Date;
  feed?: Feed;
  onCreate: () => void;
  onAsk: (text: string) => void;
  onRefresh: () => void;
  onDelete: (id: string) => void;
  onView: (value: "overview" | "map" | "alerts") => void;
}
export function Dashboard({
  view,
  alerts,
  personal,
  models,
  updated,
  feed,
  onCreate,
  onAsk,
  onRefresh,
  onDelete,
  onView,
}: DashboardProps) {
  const { t, language } = usePreferences();
  const [selected, setSelected] = useState<string>();
  const visible = view === "alerts" ? personal : [...alerts, ...personal];
  const chosen = [...alerts, ...personal].find(
    (alert) => alert.id === selected,
  );
  const select = (id: string) => setSelected(id);
  const ask = (alert: Alert) =>
    onAsk(
      `${t("selectedReport")}: ${alert.title}\n${alert.description}\n${alert.source_url || ""}`,
    );
  return (
    <div>
      <div className={styles.heading}>
        <div>
          <div className={styles.overline}>
            RESILIX /{" "}
            {t(
              view === "overview"
                ? "overview"
                : view === "map"
                  ? "liveMap"
                  : "privateAlerts",
            )}
          </div>
          <h1>
            {t(
              view === "overview"
                ? "hello"
                : view === "map"
                  ? "liveMap"
                  : "privateAlerts",
            )}
          </h1>
          <p>
            {t(
              view === "overview"
                ? "overviewBody"
                : view === "map"
                  ? "mapBody"
                  : "privateNotice",
            )}
          </p>
        </div>
        <ActionButton variant="accent" onClick={onCreate}>
          <Icon name="plus" />
          {t("createAlert")}
        </ActionButton>
      </div>
      {view === "overview" && (
        <div className={styles.metrics}>
          <MetricCard
            label={t("publicAlerts")}
            value={String(alerts.length).padStart(2, "0")}
            detail={t("sourceLinked")}
            icon={<Icon name="globe" />}
            accent
          />
          <MetricCard
            label={t("privateAlerts")}
            value={String(personal.length).padStart(2, "0")}
            detail={t("ownerOnly")}
            icon={<Icon name="lock" />}
          />
          <MetricCard
            label={t("aiReady")}
            value={
              models.some((model) => model.available) ? t("available") : "—"
            }
            detail={t("providerStatus")}
            icon={<Icon name="spark" />}
          />
        </div>
      )}
      <FeedStatus feed={feed} />
      <div
        className={`${styles.workspace} ${view === "alerts" ? styles.privateWorkspace : ""}`}
      >
        <section className={styles.mapPanel}>
          <div className={styles.panelTitle}>
            <div>
              <Icon name={view === "alerts" ? "lock" : "map"} />
              <strong>
                {t(view === "alerts" ? "privateAlerts" : "liveMap")}
              </strong>
              <Badge>{view === "alerts" ? t("ownerOnly") : "CH"}</Badge>
            </div>
            <div className={styles.panelActions}>
              {view === "overview" && (
                <button type="button" onClick={() => onView("map")}>
                  {t("viewAll")}
                  <Icon name="external" width={13} />
                </button>
              )}
              <button
                type="button"
                title={t("refresh")}
                aria-label={t("refresh")}
                onClick={onRefresh}
              >
                <Icon name="refresh" width={16} />
              </button>
            </div>
          </div>
          {view !== "alerts" && (
            <>
              <div
                className={`${styles.mapWrap} ${view === "map" ? styles.mapExpanded : ""}`}
              >
                <MapScene selected={selected} onSelect={select} />
              </div>
              <div className={styles.mapLegend}>
                <span>
                  <i className={styles.publicDot} />
                  {t("publicAlerts")}
                </span>
                <span>
                  <i className={styles.privateDot} />
                  {t("privateAlerts")}
                </span>
                <span>
                  {updated
                    ? `${t("refreshed")} ${updated.toLocaleTimeString(language, { hour: "2-digit", minute: "2-digit" })}`
                    : t("loading")}
                </span>
              </div>
            </>
          )}
          <div className={styles.listHead}>
            <h2>{t(view === "alerts" ? "privateAlerts" : "latest")}</h2>
            <span>{visible.length}</span>
          </div>
          <AlertList
            alerts={view === "overview" ? visible.slice(0, 3) : visible}
            selected={selected}
            onSelect={select}
            personal={view === "alerts"}
            onCreate={onCreate}
          />
        </section>
        <aside className={styles.rightColumn}>
          {view !== "alerts" && <RoutePlanner />}
          {chosen ? (
            <AlertDetails
              alert={chosen}
              onClose={() => setSelected(undefined)}
              onAsk={ask}
              onDelete={onDelete}
            />
          ) : (
            <>
              <div className={styles.assistantCard}>
                <div className={styles.assistantVisual}>
                  <div className={styles.orb}>
                    <Icon name="spark" width={36} height={36} />
                  </div>
                  <span />
                  <span />
                </div>
                <Badge tone="lime">RESILIX AI</Badge>
                <h2>{t("tagline")}</h2>
                <p>{t("chatBody")}</p>
                <ActionButton variant="primary" onClick={() => onAsk("")}>
                  {t("askAI")}
                  <Icon name="arrow" />
                </ActionButton>
              </div>
              <div className={styles.privacyCard}>
                <Icon name="lock" />
                <h3>{t("privacyTitle")}</h3>
                <p>{t("privacyBody")}</p>
              </div>
            </>
          )}
          <div className={styles.sources}>
            <span>{t("officialSources")}</span>
            {[
              ["Alertswiss", "https://www.alert.swiss/"],
              ["MeteoSwiss", "https://www.meteoswiss.admin.ch/"],
              ["SLF", "https://www.slf.ch/"],
            ].map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {name}
                <Icon name="external" width={12} />
              </a>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
