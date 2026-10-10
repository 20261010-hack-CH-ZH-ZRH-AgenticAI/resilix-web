"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { request } from "@/lib/api/client";
import { MessageSchema, SessionSchema } from "@/lib/realtime/geminiSchemas";
import { decodePcm16, encodePcm16 } from "@/lib/realtime/pcm";
import {
  microphoneConstraints,
  type TranscriptHandler,
  type VoiceOptions,
} from "@/lib/realtime/voiceTypes";

interface AudioResources {
  socket?: WebSocket;
  stream?: MediaStream;
  input?: AudioContext;
  output?: AudioContext;
  processor?: ScriptProcessorNode;
  sources: AudioBufferSourceNode[];
  nextPlayback: number;
  ready: boolean;
  inputText: string;
  outputText: string;
}
export function useGeminiVoice(
  language: string,
  onTranscript: TranscriptHandler,
  options: VoiceOptions = {},
) {
  const [state, setState] = useState<"idle" | "connecting" | "live">("idle");
  const [error, setError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const resources = useRef<AudioResources>({
    sources: [],
    nextPlayback: 0,
    ready: false,
    inputText: "",
    outputText: "",
  });
  const generation = useRef(0);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  const handlers = useRef(options);
  handlers.current = options;
  useEffect(() => {
    const current = resources.current;
    if (
      options.context &&
      current.ready &&
      current.socket?.readyState === WebSocket.OPEN
    )
      current.socket.send(
        JSON.stringify({
          clientContent: {
            turns: [{ role: "user", parts: [{ text: options.context }] }],
            turnComplete: false,
          },
        }),
      );
  }, [options.context]);
  const calls = useRef(new Set<string>());
  const stop = useCallback(() => {
    generation.current++;
    const current = resources.current;
    current.socket?.close();
    current.stream?.getTracks().forEach((track) => {
      track.stop();
    });
    handlers.current.onMicrophoneStop?.();
    current.processor?.disconnect();
    current.sources.forEach((source) => {
      try {
        source.stop();
      } catch {
        /* A source may already have finished playback. */
      }
    });
    void current.input?.close();
    void current.output?.close();
    resources.current = {
      sources: [],
      nextPlayback: 0,
      ready: false,
      inputText: "",
      outputText: "",
    };
    setState("idle");
    setMuted(false);
    setSpeaking(false);
  }, []);
  useEffect(() => () => stop(), [stop]);
  function play(encoded: string) {
    const current = resources.current;
    const context = current.output;
    if (!context) return;
    const samples = decodePcm16(encoded);
    const buffer = context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(new Float32Array(samples), 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const when = Math.max(context.currentTime, current.nextPlayback);
    source.start(when);
    current.nextPlayback = when + buffer.duration;
    current.sources.push(source);
    source.onended = () => {
      current.sources = current.sources.filter((item) => item !== source);
    };
  }
  async function receive(event: MessageEvent) {
    try {
      const raw =
        typeof event.data === "string"
          ? event.data
          : await (event.data as Blob).text();
      const parsed = MessageSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return;
      const message = parsed.data;
      const current = resources.current;
      for (const call of message.toolCall?.functionCalls ?? []) {
        if (calls.current.has(call.id)) continue;
        calls.current.add(call.id);
        const socket = current.socket;
        const active = generation.current;
        const output = handlers.current.executeTool
          ? await handlers.current.executeTool(call.name, call.args, call.id)
          : { ok: false, error: "Tool execution unavailable" };
        if (
          active === generation.current &&
          socket?.readyState === WebSocket.OPEN
        )
          socket.send(
            JSON.stringify({
              toolResponse: {
                functionResponses: [
                  { id: call.id, name: call.name, response: output },
                ],
              },
            }),
          );
      }
      if (message.setupComplete !== undefined) {
        current.ready = true;
        setState("live");
        if (handlers.current.context)
          current.socket?.send(
            JSON.stringify({
              clientContent: {
                turns: [
                  { role: "user", parts: [{ text: handlers.current.context }] },
                ],
                turnComplete: false,
              },
            }),
          );
      }
      const content = message.serverContent;
      if (!content) return;
      if (content.interrupted) {
        setSpeaking(false);
        current.sources.forEach((source) => {
          try {
            source.stop();
          } catch {
            /* Already complete. */
          }
        });
        current.sources = [];
        current.nextPlayback = 0;
      }
      if (content.inputTranscription)
        current.inputText += content.inputTranscription.text;
      if (content.outputTranscription)
        current.outputText += content.outputTranscription.text;
      for (const part of content.modelTurn?.parts ?? [])
        if (part.inlineData?.mimeType.startsWith("audio/pcm")) {
          setSpeaking(true);
          play(part.inlineData.data);
        }
      if (content.turnComplete) {
        setSpeaking(false);
        if (current.inputText) callback.current("user", current.inputText);
        if (current.outputText)
          callback.current("assistant", current.outputText);
        current.inputText = "";
        current.outputText = "";
      }
    } catch {
      setError(true);
    }
  }
  async function start() {
    stop();
    setError(false);
    setState("connecting");
    const active = generation.current;
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
      resources.current.stream = stream;
      handlers.current.onMicrophone?.(stream);
      calls.current.clear();
      const session = await request("realtime/session", SessionSchema, {
        provider: "gemini",
        language,
      });
      if (generation.current !== active) return;
      const endpoint = new URL(session.websocket_url);
      if (endpoint.protocol !== "wss:")
        throw new Error("Secure Gemini transport required");
      endpoint.searchParams.set("access_token", session.client_secret.value);
      const input = new AudioContext({ sampleRate: 16000 });
      const output = new AudioContext({ sampleRate: 24000 });
      await Promise.all([input.resume(), output.resume()]);
      const processor = input.createScriptProcessor(4096, 1, 1);
      const microphone = input.createMediaStreamSource(stream);
      const mute = input.createGain();
      mute.gain.value = 0;
      microphone.connect(processor);
      processor.connect(mute);
      mute.connect(input.destination);
      const socket = new WebSocket(endpoint);
      resources.current = {
        ...resources.current,
        socket,
        input,
        output,
        processor,
      };
      processor.onaudioprocess = (event) => {
        if (resources.current.ready && socket.readyState === WebSocket.OPEN)
          socket.send(
            JSON.stringify({
              realtimeInput: {
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: encodePcm16(event.inputBuffer.getChannelData(0)),
                },
              },
            }),
          );
      };
      socket.onopen = () =>
        socket.send(JSON.stringify({ setup: session.setup }));
      socket.onmessage = receive;
      socket.onerror = () => {
        if (generation.current === active) {
          stop();
          setError(true);
        }
      };
      socket.onclose = () => {
        if (generation.current === active) {
          stop();
          setError(true);
        }
      };
    } catch {
      if (generation.current === active) {
        stop();
        setError(true);
      }
    }
  }
  const toggleMute = useCallback(() => {
    setMuted((value) => {
      resources.current.stream?.getAudioTracks().forEach((track) => {
        track.enabled = value;
      });
      return !value;
    });
  }, []);
  return { state, error, start, stop, muted, speaking, toggleMute };
}
