"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMapWorkspace } from "@/features/maps/MapWorkspaceProvider";
import { useActionTools } from "@/hooks/useActionTools";
import { useAudioClip } from "@/hooks/useAudioClip";
import { useDiarization } from "@/hooks/useDiarization";
import { useGeminiVoice } from "@/hooks/useGeminiVoice";
import { useIncident } from "@/hooks/useIncident";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import { type AudioSegment, blobBase64, transcribeClip } from "@/lib/api/audio";
import { apiErrorKey } from "@/lib/api/errors";
import { EntityRoleSchema } from "@/lib/api/incidents";
import type { MessageKey } from "@/lib/i18n/messages";
import { usePreferences } from "@/lib/i18n/Provider";
import { selectionContext } from "@/lib/realtime/toolBridge";
import type { TranscriptHandler } from "@/lib/realtime/voiceTypes";
import { chatLabels } from "./chatLabels";
import { type ConversationMessage, useAssistant } from "./useAssistant";
export function useChatWorkspace({
  prompt,
  active,
  onPromptUsed,
}: {
  prompt: string;
  active: boolean;
  onPromptUsed: () => void;
}) {
  const { t, language } = usePreferences();
  const l = chatLabels[language];
  const [input, setInput] = useState("");
  const [model, setModel] = useState("auto");
  const [imageMode, setImageMode] = useState(false);
  const [mode, setMode] = useState<"assistant" | "response">("assistant");
  const [creating, setCreating] = useState(true);
  const [title, setTitle] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "gemini">(
    "openai",
  );
  const [voiceMode, setVoiceMode] = useState<"voice" | "dictation">("voice");
  const [analysis, setAnalysis] = useState(false);
  const [readAloud, setReadAloud] = useState(true);
  const [clipBusy, setClipBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [recordings, setRecordings] = useState<
    Record<string, { audioUrl: string; segments: AudioSegment[] }>
  >({});
  const ownedAudio = useRef<string[]>([]);
  const lifetime = useRef(0);
  const end = useRef<HTMLDivElement>(null);
  const assistant = useAssistant(language);
  const incidents = useIncident(language);
  const map = useMapWorkspace();
  const recorder = useAudioClip();
  const diarization = useDiarization();
  const onResponse = useCallback(() => {
    setMode("response");
    setCreating(false);
  }, []);
  const tools = useActionTools(
    incidents,
    assistant,
    map.planRoute,
    onResponse,
    t("imageNotice"),
  );
  const onTranscript: TranscriptHandler = (role, text, meta) => {
    if (voiceMode === "dictation" && role === "user")
      setInput((value) => (value ? `${value} ${text}` : text));
    else
      assistant.append(role, text, {
        source: "voice",
        id: meta?.id ? `voice:${meta.id}` : undefined,
      });
  };
  const options = {
    context: selectionContext(
      incidents.incident
        ? {
            incident_id: incidents.incident.id,
            revision: incidents.incident.revision,
            status: incidents.incident.status,
          }
        : undefined,
    ),
    executeTool: tools.execute,
    onMicrophone: (stream: MediaStream) => {
      if (analysis) diarization.start(stream);
    },
    onMicrophoneStop: diarization.stop,
  };
  const openai = useRealtimeVoice(language, onTranscript, options);
  const gemini = useGeminiVoice(language, onTranscript, options);
  const voice =
    voiceProvider === "gemini" && voiceMode === "voice" ? gemini : openai;
  const stopAll = useCallback(() => {
    openai.stop();
    gemini.stop();
    recorder.stop();
  }, [openai.stop, gemini.stop, recorder.stop]);
  const messages = useMemo<ConversationMessage[]>(() => {
    const team = (incidents.incident?.messages ?? []).map(
      (message): ConversationMessage => {
        const role = EntityRoleSchema.safeParse(message.role);
        return {
          id: message.id,
          role: message.role === "user" ? "user" : "assistant",
          text: message.text,
          entity: role.success ? role.data : undefined,
          isSimulation: true,
          createdAt: message.created_at,
          superseded:
            message.superseded ||
            message.status === "superseded" ||
            message.revision !== incidents.incident?.revision,
          model: `${l.revision} ${message.revision}`,
          ...recordings[message.id],
        };
      },
    );
    return [...assistant.messages, ...team]
      .filter((message) => !hidden.has(message.id))
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  }, [assistant.messages, incidents.incident, recordings, hidden, l.revision]);
  const speech = useSpeechPlayback(
    language,
    messages,
    readAloud && voice.state === "live",
    voice.speaking,
  );
  useEffect(() => {
    if (incidents.incident?.id) setCreating(false);
  }, [incidents.incident?.id]);
  useEffect(() => {
    if (prompt) {
      setInput(prompt);
      setMode("assistant");
      onPromptUsed();
    }
  }, [prompt, onPromptUsed]);
  useEffect(() => {
    if (active && messages.length)
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length, active]);
  useEffect(() => {
    if (!active) {
      stopAll();
      speech.stop();
    }
  }, [active, stopAll, speech.stop]);
  useEffect(
    () => () => {
      lifetime.current++;
      for (const url of ownedAudio.current) URL.revokeObjectURL(url);
    },
    [],
  );
  const startVoice = (nextMode: "voice" | "dictation") => {
    if (openai.state !== "idle" || gemini.state !== "idle") {
      stopAll();
      return;
    }
    recorder.stop();
    setVoiceMode(nextMode);
    if (nextMode === "voice" && voiceProvider === "gemini") void gemini.start();
    else void openai.start(nextMode);
  };
  const send = async (
    text = input,
    attachment?: { audioUrl: string; segments: AudioSegment[] },
  ) => {
    if (!text.trim()) return false;
    setError("");
    try {
      if (mode === "response") {
        const updated =
          creating || !incidents.incident
            ? await incidents.start(title.trim() || text.slice(0, 80), text)
            : await incidents.steer(text);
        const message = updated.messages.findLast(
          (entry) =>
            entry.role === "user" &&
            entry.text === text &&
            entry.revision === updated.revision,
        );
        if (attachment && message)
          setRecordings((old) => ({ ...old, [message.id]: attachment }));
        setCreating(false);
      } else if (
        !(await assistant.send(
          text,
          model,
          imageMode,
          t("imageNotice"),
          attachment,
        ))
      )
        return false;
      setInput("");
      return true;
    } catch (reason) {
      setError(apiErrorKey(reason));
      return false;
    }
  };
  const sendClip = async () => {
    if (!recorder.clip || clipBusy) return;
    const activeLifetime = lifetime.current;
    setClipBusy(true);
    setError("");
    try {
      const blob = recorder.clip.blob;
      const result = await transcribeClip(
        await blobBase64(blob),
        blob.type,
        language,
      );
      if (activeLifetime !== lifetime.current) return;
      if (!result.text.trim()) throw new Error("No speech recognized");
      const audioUrl = URL.createObjectURL(blob);
      ownedAudio.current.push(audioUrl);
      const sent = await send(result.text, {
        audioUrl,
        segments: result.segments,
      });
      if (sent && activeLifetime === lifetime.current) recorder.discard();
    } catch (reason) {
      setError(apiErrorKey(reason));
    } finally {
      setClipBusy(false);
    }
  };
  const newExercise = () => {
    setCreating(true);
    setMode("response");
    setImageMode(false);
    setTitle("");
    setInput("");
  };
  const visibleError = error || incidents.error || assistant.error;
  return {
    t,
    language,
    l,
    input,
    setInput,
    model,
    setModel,
    imageMode,
    setImageMode,
    mode,
    setMode,
    creating,
    title,
    setTitle,
    voiceProvider,
    setVoiceProvider,
    analysis,
    setAnalysis,
    readAloud,
    setReadAloud,
    clipBusy,
    end,
    assistant,
    incidents,
    recorder,
    diarization,
    tools,
    voice,
    stopAll,
    messages,
    speech,
    startVoice,
    send,
    sendClip,
    newExercise,
    visibleError,
    setHidden,
  };
}
