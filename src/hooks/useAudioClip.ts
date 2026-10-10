"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { microphoneConstraints } from "@/lib/realtime/voiceTypes";

export function useAudioClip() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [clip, setClip] = useState<{ blob: Blob; url: string }>();
  const [error, setError] = useState(false);
  const [limited, setLimited] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const bytes = useRef(0);
  const url = useRef<string | undefined>(undefined);
  const generation = useRef(0);
  const stop = useCallback(() => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    stream.current = null;
    setRecording(false);
  }, []);
  const discard = useCallback(() => {
    generation.current++;
    stop();
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = undefined;
    setClip(undefined);
    setSeconds(0);
    setLimited(false);
  }, [stop]);
  useEffect(
    () => () => {
      generation.current++;
      stop();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [stop],
  );
  useEffect(() => {
    if (!recording) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSeconds(elapsed);
      if (elapsed >= 60) {
        setLimited(true);
        stop();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [recording, stop]);
  async function start() {
    discard();
    setError(false);
    const active = generation.current;
    try {
      if (!globalThis.MediaRecorder) throw new Error("Recording unsupported");
      const input = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints,
      });
      if (active !== generation.current) {
        input.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      stream.current = input;
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const media = new MediaRecorder(
        input,
        mimeType ? { mimeType } : undefined,
      );
      recorder.current = media;
      chunks.current = [];
      bytes.current = 0;
      media.ondataavailable = (event) => {
        if (active !== generation.current || !event.data.size) return;
        bytes.current += event.data.size;
        if (bytes.current > 8 * 1024 * 1024) {
          setLimited(true);
          stop();
          return;
        }
        chunks.current.push(event.data);
      };
      media.onerror = () => {
        setError(true);
        stop();
      };
      media.onstop = () => {
        if (active !== generation.current) return;
        const blob = new Blob(chunks.current, { type: media.mimeType });
        if (!blob.size || bytes.current > 8 * 1024 * 1024) {
          setError(true);
          return;
        }
        const value = URL.createObjectURL(blob);
        url.current = value;
        setClip({ blob, url: value });
      };
      media.start(250);
      setRecording(true);
    } catch {
      stop();
      setError(true);
    }
  }
  return { recording, seconds, clip, error, limited, start, stop, discard };
}
