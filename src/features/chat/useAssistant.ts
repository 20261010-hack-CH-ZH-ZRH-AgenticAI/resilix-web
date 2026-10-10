"use client";
import type { AssistantCard } from "@resilix/ui-chat";
import { useCallback, useRef, useState } from "react";
import { generateImage, sendChat } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import type { MessageKey } from "@/lib/i18n/messages";
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  cards?: AssistantCard[];
  model?: string;
}
export function useAssistant(language: string) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<MessageKey | "">("");
  const generation = useRef(0);
  const append = useCallback(
    (role: "user" | "assistant", text: string) =>
      setMessages((values) => [
        ...values,
        { id: crypto.randomUUID(), role, text },
      ]),
    [],
  );
  async function send(
    text: string,
    model: string,
    image: boolean,
    imageLabel: string,
  ) {
    if (busy || !text.trim()) return;
    const active = generation.current;
    const history = messages
      .slice(-16)
      .map((value) => ({ role: value.role, content: value.text }));
    append("user", text);
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
              text: result.text,
              cards: result.cards,
              model: result.model,
            },
          ]);
      }
    } catch (reason) {
      if (generation.current === active) setError(apiErrorKey(reason));
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
