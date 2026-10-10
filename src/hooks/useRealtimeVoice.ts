"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { realtimeSession } from "@/lib/api/client";
import { completeOpenAITool } from "@/lib/realtime/toolBridge";
import {
  microphoneConstraints,
  type TranscriptHandler,
  type VoiceOptions,
} from "@/lib/realtime/voiceTypes";

const EventSchema = z.object({
  type: z.string(),
  transcript: z.string().optional(),
  text: z.string().optional(),
  delta: z.string().optional(),
  name: z.string().optional(),
  arguments: z.string().optional(),
  call_id: z.string().optional(),
  response_id: z.string().optional(),
  item_id: z.string().optional(),
});
export function useRealtimeVoice(
  language: string,
  onTranscript: TranscriptHandler,
  options: VoiceOptions = {},
) {
  const [state, setState] = useState<"idle" | "connecting" | "live">("idle");
  const [error, setError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const connection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const media = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const generation = useRef(0);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const handlers = useRef(options);
  handlers.current = options;
  const calls = useRef(new Set<string>());
  const stop = useCallback(() => {
    generation.current++;
    connection.current?.close();
    connection.current = null;
    dataChannel.current = null;
    media.current?.getTracks().forEach((track) => {
      track.stop();
    });
    media.current = null;
    handlers.current.onMicrophoneStop?.();
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    setState("idle");
    setMuted(false);
    setSpeaking(false);
  }, []);
  useEffect(() => {
    if (options.context && dataChannel.current?.readyState === "open")
      dataChannel.current.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: options.context }],
          },
        }),
      );
  }, [options.context]);
  useEffect(
    () => () => {
      generation.current++;
      connection.current?.close();
      media.current?.getTracks().forEach((track) => {
        track.stop();
      });
      audio.current?.pause();
      handlers.current.onMicrophoneStop?.();
    },
    [],
  );
  async function start(mode: "voice" | "dictation" = "voice") {
    setError(false);
    setState("connecting");
    const active = ++generation.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: microphoneConstraints,
      });
      if (generation.current !== active) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      media.current = stream;
      handlers.current.onMicrophone?.(stream);
      calls.current.clear();
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
      dataChannel.current = channel;
      channel.onopen = () => {
        const context = handlers.current.context;
        if (context)
          channel.send(
            JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: context }],
              },
            }),
          );
      };
      channel.onmessage = (event) => {
        try {
          const parsed = EventSchema.safeParse(JSON.parse(event.data));
          if (!parsed.success) return;
          const data = parsed.data;
          if (data.type === "output_audio_buffer.started") setSpeaking(true);
          if (
            [
              "output_audio_buffer.stopped",
              "output_audio_buffer.cleared",
            ].includes(data.type)
          )
            setSpeaking(false);
          if (data.type === "error") setError(true);
          if (
            data.type === "response.function_call_arguments.done" &&
            data.call_id &&
            data.name &&
            data.arguments
          ) {
            const callId = data.call_id;
            if (calls.current.has(callId)) return;
            calls.current.add(callId);
            void completeOpenAITool(
              { name: data.name, arguments: data.arguments, call_id: callId },
              handlers.current.executeTool,
              channel,
              () => generation.current === active,
            );
          }
          if (
            data.type ===
              "conversation.item.input_audio_transcription.completed" &&
            data.transcript
          )
            callback.current("user", data.transcript, {
              id: data.item_id,
              source: mode,
            });
          if (
            [
              "response.output_audio_transcript.done",
              "response.audio_transcript.done",
            ].includes(data.type) &&
            data.transcript
          )
            callback.current("assistant", data.transcript, {
              id: data.response_id,
              source: mode,
            });
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
  const toggleMute = useCallback(() => {
    setMuted((value) => {
      media.current?.getAudioTracks().forEach((track) => {
        track.enabled = value;
      });
      return !value;
    });
  }, []);
  return { state, error, start, stop, muted, speaking, toggleMute };
}
