"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiErrorKey } from "@/lib/api/errors";
import {
  createIncident,
  getIncident,
  type Incident,
  listIncidents,
  type SteeringAction,
  steerIncident,
} from "@/lib/api/incidents";
import type { MessageKey } from "@/lib/i18n/messages";

export function useIncident(language: string) {
  const [incident, setIncident] = useState<Incident>();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  const current = useRef<string | undefined>(undefined);
  const generation = useRef(0);
  const accept = useCallback((value: Incident) => {
    current.current = value.id;
    setIncident((old) =>
      !old || old.id !== value.id || old.version <= value.version ? value : old,
    );
    setIncidents((old) => [
      value,
      ...old.filter((item) => item.id !== value.id),
    ]);
  }, []);
  const inspect = useCallback(
    async (id: string) => {
      try {
        const { incident: value } = await getIncident(id);
        accept(value);
        setError("");
        return value;
      } catch (reason) {
        setError(apiErrorKey(reason));
        throw reason;
      }
    },
    [accept],
  );
  const refresh = useCallback(async () => {
    if (!current.current) return;
    const id = current.current;
    try {
      const { incident: value } = await getIncident(id);
      if (current.current === id) accept(value);
      setError("");
    } catch (reason) {
      setError(apiErrorKey(reason));
    }
  }, [accept]);
  useEffect(() => {
    const active = ++generation.current;
    void listIncidents()
      .then(({ incidents: values }) => {
        if (active !== generation.current) return;
        setIncidents(values);
        if (values[0])
          accept(
            values.find((value) =>
              ["running", "queued", "paused"].includes(value.status),
            ) ?? values[0],
          );
      })
      .catch((reason) => setError(apiErrorKey(reason)));
    const timer = setInterval(() => void refresh(), 2500);
    const socket = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/events`,
    );
    socket.onmessage = (event) => {
      try {
        const data: unknown = JSON.parse(event.data);
        if (
          typeof data === "object" &&
          data !== null &&
          "type" in data &&
          typeof data.type === "string" &&
          data.type.startsWith("incident.")
        )
          void refresh();
      } catch {
        setError("errorUnknown");
      }
    };
    return () => {
      generation.current++;
      clearInterval(timer);
      socket.close();
    };
  }, [accept, refresh]);
  async function start(
    title: string,
    description: string,
    requestedLanguage = language,
  ) {
    setBusy(true);
    setError("");
    try {
      const { incident: value } = await createIncident(
        title,
        description,
        requestedLanguage,
      );
      accept(value);
      return value;
    } catch (reason) {
      setError(apiErrorKey(reason));
      throw reason;
    } finally {
      setBusy(false);
    }
  }
  async function steer(
    message: string,
    action: SteeringAction = "update",
    id = current.current,
  ) {
    if (!id) throw new Error("No incident selected");
    setBusy(true);
    setError("");
    try {
      const { incident: value } = await steerIncident(id, message, action);
      accept(value);
      return value;
    } catch (reason) {
      setError(apiErrorKey(reason));
      throw reason;
    } finally {
      setBusy(false);
    }
  }
  return { incident, incidents, busy, error, start, steer, inspect, refresh };
}
