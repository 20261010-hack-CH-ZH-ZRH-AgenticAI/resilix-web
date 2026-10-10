"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationMessage } from "@/features/chat/useAssistant";
import { audioBlobUrl, speech } from "@/lib/api/audio";

export function useSpeechPlayback(
  language: string,
  messages: ConversationMessage[],
  enabled: boolean,
  blocked = false,
) {
  const [playing, setPlaying] = useState<string>();
  const [loading, setLoading] = useState<string>();
  const [error, setError] = useState(false);
  const cache = useRef(new Map<string, string>());
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const seen = useRef(new Set<string>());
  const queue = useRef<ConversationMessage[]>([]);
  const draining = useRef(false);
  const generation = useRef(0);
  const automatic = useRef<string | undefined>(undefined);
  const previousEnabled = useRef(enabled);
  const activatedAt = useRef(enabled ? Date.now() : Number.POSITIVE_INFINITY);
  const preferences = useRef({ language, enabled, blocked, messages });
  preferences.current = { language, enabled, blocked, messages };
  const stop = useCallback(() => {
    generation.current++;
    queue.current = [];
    automatic.current = undefined;
    audio.current?.pause();
    audio.current?.dispatchEvent(new Event("ended"));
    audio.current = undefined;
    setPlaying(undefined);
    setLoading(undefined);
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      audio.current?.pause();
      audio.current?.dispatchEvent(new Event("ended"));
      for (const url of cache.current.values()) URL.revokeObjectURL(url);
      cache.current.clear();
    },
    [],
  );
  const perform = useCallback(
    async (message: ConversationMessage, auto = false) => {
      const active = generation.current;
      automatic.current = auto ? message.id : undefined;
      setError(false);
      setLoading(message.id);
      try {
        const key = `${message.id}:${preferences.current.language}`;
        let url = cache.current.get(key);
        if (!url) {
          const result = await speech(
            message.text,
            message.entity ?? "manager",
            preferences.current.language,
          );
          if (generation.current !== active) return;
          url = audioBlobUrl(result.audio_base64, result.mime_type);
          cache.current.set(key, url);
        }
        if (
          generation.current !== active ||
          (auto &&
            preferences.current.messages.some(
              (item) => item.id === message.id && item.superseded,
            ))
        )
          return;
        setLoading(undefined);
        setPlaying(message.id);
        const player = new Audio(url);
        audio.current = player;
        await new Promise<void>((resolve, reject) => {
          player.onended = () => resolve();
          player.onerror = () => reject(new Error("Playback failed"));
          if (!preferences.current.blocked) void player.play().catch(reject);
        });
      } catch {
        if (generation.current === active) setError(true);
      } finally {
        if (generation.current === active) {
          automatic.current = undefined;
          audio.current = undefined;
          setPlaying(undefined);
          setLoading(undefined);
        }
      }
    },
    [],
  );
  const drain = useCallback(async () => {
    if (draining.current) return;
    draining.current = true;
    while (
      queue.current.length &&
      preferences.current.enabled &&
      !preferences.current.blocked
    ) {
      const message = queue.current.shift();
      if (message) await perform(message, true);
    }
    draining.current = false;
  }, [perform]);
  useEffect(() => {
    if (previousEnabled.current && !enabled) stop();
    if (!previousEnabled.current && enabled) activatedAt.current = Date.now();
    previousEnabled.current = enabled;
  }, [enabled, stop]);
  useEffect(() => {
    if (!audio.current || !playing) return;
    if (blocked) audio.current.pause();
    else
      void audio.current.play().catch(() => {
        setError(true);
        stop();
      });
  }, [blocked, playing, stop]);
  useEffect(() => {
    queue.current = queue.current.filter(
      (entry) =>
        !messages.some(
          (message) => message.id === entry.id && message.superseded,
        ),
    );
    if (
      automatic.current &&
      messages.some(
        (message) => message.id === automatic.current && message.superseded,
      )
    )
      stop();
    for (const message of messages) {
      if (seen.current.has(message.id)) continue;
      seen.current.add(message.id);
      if (
        enabled &&
        message.role === "assistant" &&
        message.isSimulation &&
        !message.superseded &&
        (!message.createdAt ||
          Date.parse(message.createdAt) >= activatedAt.current)
      )
        queue.current.push(message);
    }
    if (enabled && !blocked) void drain();
  }, [messages, enabled, blocked, drain, stop]);
  const play = useCallback(
    (message: ConversationMessage) => {
      stop();
      void perform(message);
    },
    [stop, perform],
  );
  return { playing, loading, error, play, stop };
}
