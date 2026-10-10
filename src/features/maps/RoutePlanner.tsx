"use client";
import { ActionButton, Icon } from "@resilix/ui-components";
import { useId, useState } from "react";
import { CoordinateInputs } from "./CoordinateInputs";
import { MapScene } from "./MapScene";
import { useMapWorkspace } from "./MapWorkspaceProvider";
import { useMapMessages } from "./messages";
import styles from "./RoutePlannerStyles.module.css";
import { RouteSummary } from "./RouteSummary";
import type { RouteProfile } from "./route-api";
export function RoutePlanner({ compact = false }: { compact?: boolean }) {
  const map = useMapWorkspace();
  const { messages } = useMapMessages();
  const [preview, setPreview] = useState<boolean>();
  const previewVisible = preview ?? Boolean(map.route || map.picking);
  const id = useId();
  const reports = map.markers.filter(
    (item) =>
      typeof item.latitude === "number" &&
      typeof item.longitude === "number" &&
      Math.abs(item.latitude) <= 85 &&
      Math.abs(item.longitude) <= 180,
  );
  return (
    <section className={styles.planner} aria-labelledby={`${id}-title`}>
      <div className={styles.heading}>
        <Icon name="map" />
        <h2 id={`${id}-title`}>{messages.title}</h2>
      </div>
      <p className={styles.body}>{messages.body}</p>
      <div className={styles.actions}>
        <ActionButton
          compact
          variant="accent"
          onClick={map.locate}
          disabled={map.locating}
        >
          <Icon name="pin" />
          {map.locating ? messages.locating : messages.useLocation}
        </ActionButton>
        <button
          type="button"
          className={styles.textButton}
          onClick={map.clearRoute}
        >
          {messages.clear}
        </button>
      </div>
      <p className={styles.privacy}>{messages.locationPrivacy}</p>
      {map.position?.accuracy_m !== undefined && (
        <output className={styles.accuracy}>
          {messages.accuracy}: ±{Math.round(map.position.accuracy_m)} m
        </output>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void map.planRoute().catch(() => undefined);
        }}
      >
        <CoordinateInputs
          label={messages.origin}
          value={map.originFields}
          onChange={map.setOriginFields}
          messages={messages}
        />
        <CoordinateInputs
          label={messages.destination}
          value={map.destinationFields}
          onChange={map.setDestinationInput}
          messages={messages}
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.pick}
            aria-pressed={map.picking}
            onClick={() => {
              map.setPicking(!map.picking);
              setPreview(true);
            }}
          >
            {messages.pick}
          </button>
          {reports.length > 0 && (
            <label className={styles.reportSelect}>
              <span>{messages.chooseReport}</span>
              <select
                value=""
                onChange={(event) => {
                  const report = reports.find(
                    (item) => item.id === event.target.value,
                  );
                  if (
                    typeof report?.latitude === "number" &&
                    typeof report.longitude === "number"
                  )
                    map.setDestination({
                      latitude: report.latitude,
                      longitude: report.longitude,
                    });
                }}
              >
                <option value="">{messages.chooseReportHint}</option>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {map.picking && (
          <output className={styles.hint}>{messages.pickHint}</output>
        )}
        <label className={styles.mode}>
          <span>{messages.profile}</span>
          <select
            value={map.profile}
            onChange={(event) =>
              map.setProfile(event.target.value as RouteProfile)
            }
          >
            {(["foot", "bike", "car"] as const).map((profile) => (
              <option key={profile} value={profile}>
                {messages[profile]}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.consent}>
          <input
            type="checkbox"
            checked={map.consent}
            onChange={(event) => map.setConsent(event.target.checked)}
          />
          <span>
            {messages.consent}{" "}
            <a
              href="https://www.fossgis.de/datenschutzerklärung/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {messages.policy} ↗
            </a>
          </span>
        </label>
        <ActionButton type="submit" variant="primary" disabled={map.busy}>
          {map.busy ? messages.calculating : messages.calculate}
          <Icon name="arrow" />
        </ActionButton>
      </form>
      {map.error && (
        <p role="alert" className={styles.error}>
          {messages[map.error]}
        </p>
      )}
      <RouteSummary />
      {compact && (
        <>
          <button
            type="button"
            className={styles.textButton}
            aria-expanded={previewVisible}
            onClick={() => setPreview(!previewVisible)}
          >
            {previewVisible ? messages.hidePreview : messages.showPreview}
          </button>
          {previewVisible && (
            <div className={styles.preview}>
              <MapScene />
            </div>
          )}
        </>
      )}
    </section>
  );
}
