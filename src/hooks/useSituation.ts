"use client";
import { useCallback, useEffect, useState } from "react";
import {
  type Alert,
  type Feed,
  getAlerts,
  getModels,
  getPublicConfig,
  type Model,
  type PublicConfig,
} from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
export function useSituation(active: boolean) {
  const [feed, setFeed] = useState<Feed>();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [personal, setPersonal] = useState<Alert[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [config, setConfig] = useState<PublicConfig>({
    mapAttribution: "swisstopo",
  });
  const [updated, setUpdated] = useState<Date>();
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  const refresh = useCallback(async () => {
    const results = await Promise.allSettled([
      getAlerts(),
      getAlerts(true),
      getModels(),
    ]);
    const [publicResult, privateResult, modelResult] = results;
    if (publicResult.status === "fulfilled") {
      setAlerts(publicResult.value.alerts);
      setFeed(publicResult.value.feed);
      setUpdated(new Date());
    }
    if (privateResult.status === "fulfilled")
      setPersonal(privateResult.value.alerts);
    if (modelResult.status === "fulfilled") setModels(modelResult.value.models);
    const failure = results.find((result) => result.status === "rejected");
    setError(failure ? apiErrorKey(failure.reason) : "");
  }, []);
  useEffect(() => {
    if (!active) {
      setAlerts([]);
      setPersonal([]);
      return;
    }
    void refresh();
    void getPublicConfig()
      .then(setConfig)
      .catch((reason) => setError(apiErrorKey(reason)));
    const interval = setInterval(refresh, 30_000);
    const socket = new WebSocket(
      `${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/api/events`,
    );
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = () => void refresh();
    return () => {
      clearInterval(interval);
      socket.close();
      setConnected(false);
    };
  }, [active, refresh]);
  return {
    alerts,
    personal,
    feed,
    models,
    config,
    updated,
    connected,
    error,
    refresh,
  };
}
