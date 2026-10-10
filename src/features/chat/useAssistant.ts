"use client";
import type { AssistantCard } from "@resilix/ui-chat";
import { useCallback, useRef, useState } from "react";
import type { AudioSegment } from "@/lib/api/audio";
import { generateImage, sendChat } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { EntityRole } from "@/lib/api/incidents";
import type { MessageKey } from "@/lib/i18n/messages";
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: AssistantCard[];
  model?: string;
  createdAt?: string;
  entity?: EntityRole;
  isSimulation?: boolean;
  audioUrl?: string;
  segments?: AudioSegment[];
  source?: "voice" | "dictation";
  superseded?: boolean;
}
export function useAssistant(language: string) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  const generation = useRef(0);
  const append = useCallback(
    (
      role: "user" | "assistant",
      text: string,
      details: Partial<ConversationMessage> = {},
    ) =>
      setMessages((values) =>
        details.id && values.some((value) => value.id === details.id)
          ? values
          : [
              ...values,
              {
                createdAt: new Date().toISOString(),
                ...details,
                id: details.id ?? crypto.randomUUID(),
                role,
                text,
              },
            ],
      ),
    [],
  );
  async function send(
    text: string,
    model: string,
    image: boolean,
    imageLabel: string,
    attachment?: Pick<ConversationMessage, "audioUrl" | "segments">,
  ) {
    if (busy || !text.trim()) return false;
    const active = generation.current;
    const history = messages
      .slice(-16)
      .map((value) => ({ role: value.role, content: value.text }));
    append("user", text, attachment);
    setBusy(true);
    setError("");
    try {
      if (image) {
        const result = await generateImage(text);
        const data =
          result.image_base64 || result.b64_json || result.data?.[0]?.b64_json;
        const imageUrl = data
          ? `data:${result.mime_type || "image/png"};base64,${data}`
          : result.image_url || result.data?.[0]?.url;
        if (!imageUrl) throw new Error("Image response was empty");
        if (generation.current === active)
          setMessages((values) => [
            ...values,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              createdAt: new Date().toISOString(),
              text: imageLabel,
              model: result.model,
              cards: [
                { type: "image", title: imageLabel, image_url: imageUrl },
              ],
            },
          ]);
      } else {
        const result = await sendChat(text, model, language, history);
        if (generation.current === active)
          setMessages((values) => [
            ...values,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              createdAt: new Date().toISOString(),
              text: result.text,
              cards: result.cards,
              model: result.model,
            },
          ]);
      }
      return true;
    } catch (reason) {
      if (generation.current === active) setError(apiErrorKey(reason));
      return false;
    } finally {
      if (generation.current === active) setBusy(false);
    }
  }
  const clear = () => {
    generation.current++;
    setMessages([]);
    setBusy(false);
    setError("");
  };
  return { messages, busy, error, send, append, clear };
}
