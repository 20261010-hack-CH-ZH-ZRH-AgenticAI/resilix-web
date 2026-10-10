"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { realtimeSession } from "@/lib/api/client";

const EventSchema = z.object({
  type: z.string(),
  transcript: z.string().optional(),
  text: z.string().optional(),
  delta: z.string().optional(),
});
export function useRealtimeVoice(
  language: string,
  onTranscript: (role: "user" | "assistant", text: string) => void,
) {
  const [state, setState] = useState<"idle" | "connecting" | "live">("idle");
  const [error, setError] = useState(false);
  const connection = useRef<RTCPeerConnection | null>(null);
  const media = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const generation = useRef(0);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const stop = useCallback(() => {
    generation.current++;
    connection.current?.close();
    connection.current = null;
    media.current?.getTracks().forEach((track) => {
      track.stop();
    });
    media.current = null;
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    setState("idle");
  }, []);
  useEffect(
    () => () => {
      generation.current++;
      connection.current?.close();
      media.current?.getTracks().forEach((track) => {
        track.stop();
      });
      audio.current?.pause();
    },
    [],
  );
  async function start(mode: "voice" | "dictation" = "voice") {
    setError(false);
    setState("connecting");
    const active = ++generation.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (generation.current !== active) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      media.current = stream;
      const session = await realtimeSession(language, mode);
      if (generation.current !== active) return;
      const endpoint = new URL(session.calls_url);
      if (endpoint.protocol !== "https:")
        throw new Error("Secure voice endpoint required");
      const pc = new RTCPeerConnection();
      connection.current = pc;
      audio.current = new Audio();
      audio.current.autoplay = true;
      pc.ontrack = (event) => {
        if (audio.current) {
          audio.current.srcObject = event.streams[0];
          void audio.current.play().catch(() => setError(true));
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setState("live");
        if (
          ["failed", "disconnected", "closed"].includes(pc.connectionState) &&
          generation.current === active
        ) {
          setError(true);
          stop();
        }
      };
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
      const channel = pc.createDataChannel("oai-events");
      channel.onmessage = (event) => {
        try {
          const parsed = EventSchema.safeParse(JSON.parse(event.data));
          if (!parsed.success) return;
          const data = parsed.data;
          if (
            data.type ===
              "conversation.item.input_audio_transcription.completed" &&
            data.transcript
          )
            callback.current("user", data.transcript);
          if (
            [
              "response.output_audio_transcript.done",
              "response.audio_transcript.done",
            ].includes(data.type) &&
            data.transcript
          )
            callback.current("assistant", data.transcript);
        } catch {
          setError(true);
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.client_secret.value}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });
      if (!response.ok) throw new Error("Voice negotiation failed");
      if (generation.current !== active) return;
      await pc.setRemoteDescription({
        type: "answer",
        sdp: await response.text(),
      });
    } catch {
      if (generation.current === active) {
        stop();
        setError(true);
      }
    }
  }
  return { state, error, start, stop };
}
