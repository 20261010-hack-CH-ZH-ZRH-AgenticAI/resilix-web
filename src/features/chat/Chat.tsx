"use client";
import { Composer, StructuredCard } from "@resilix/ui-chat";
import { ActionButton, Badge, Icon } from "@resilix/ui-components";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGeminiVoice } from "@/hooks/useGeminiVoice";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import type { Model } from "@/lib/api/client";
import { usePreferences } from "@/lib/i18n/Provider";
import baseStyles from "./ChatStyles.module.css";
import voiceStyles from "./ChatVoiceStyles.module.css";

const styles = { ...baseStyles, ...voiceStyles };

import { ChatEmptyState } from "./ChatEmptyState";
import { useAssistant } from "./useAssistant";
export function Chat({
  models,
  prompt,
  active,
  onPromptUsed,
}: {
  models: Model[];
  prompt: string;
  active: boolean;
  onPromptUsed: () => void;
}) {
  const { t, language } = usePreferences();
  const [input, setInput] = useState("");
  const [model, setModel] = useState("auto");
  const [imageMode, setImageMode] = useState(false);
  const [voiceProvider, setVoiceProvider] = useState<"openai" | "gemini">(
    "openai",
  );
  const [voiceMode, setVoiceMode] = useState<"voice" | "dictation">("voice");
  const end = useRef<HTMLDivElement>(null);
  const assistant = useAssistant(language);
  const openai = useRealtimeVoice(language, (role, text) => {
    if (voiceMode === "dictation" && role === "user")
      setInput((value) => (value ? `${value} ${text}` : text));
    else assistant.append(role, text);
  });
  const gemini = useGeminiVoice(language, assistant.append);
  const voice =
    voiceProvider === "gemini" && voiceMode === "voice" ? gemini : openai;
  const stopAll = useCallback(() => {
    openai.stop();
    gemini.stop();
  }, [openai.stop, gemini.stop]);
  useEffect(() => {
    if (prompt) {
      setInput(prompt);
      onPromptUsed();
    }
  }, [prompt, onPromptUsed]);
  useEffect(() => {
    if (active && (assistant.messages.length > 0 || assistant.busy))
      end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [assistant.messages.length, assistant.busy, active]);
  useEffect(() => {
    if (!active) stopAll();
  }, [active, stopAll]);
  const send = () => {
    if (!input.trim() || assistant.busy) return;
    void assistant.send(input, model, imageMode, t("imageNotice"));
    setInput("");
  };
  const startVoice = (mode: "voice" | "dictation") => {
    if (openai.state !== "idle" || gemini.state !== "idle") stopAll();
    else {
      setVoiceMode(mode);
      if (mode === "voice" && voiceProvider === "gemini") void gemini.start();
      else void openai.start(mode);
    }
  };
  const textModels = models.filter(
    (value) => !/(realtime|transcribe|image|live)/.test(value.id),
  );
  return (
    <section className={styles.chat}>
      <header className={styles.chatHeader}>
        <div>
          <Icon name="spark" />
          <strong>{t("assistant")}</strong>
          <Badge tone="lime">Resilix</Badge>
        </div>
        <div className={styles.headerTools}>
          <select
            className={styles.voiceProvider}
            aria-label={t("voiceProvider")}
            value={voiceProvider}
            onChange={(event) => {
              stopAll();
              setVoiceProvider(event.target.value as "openai" | "gemini");
            }}
          >
            <option value="openai">OpenAI · {t("voicePrimary")}</option>
            <option value="gemini">Gemini Live · {t("voiceBackup")}</option>
          </select>
          <ActionButton
            variant="ghost"
            compact
            aria-label={t("clearView")}
            title={t("clearViewHint")}
            onClick={() => {
              stopAll();
              assistant.clear();
              setInput("");
            }}
          >
            <Icon name="plus" />
          </ActionButton>
        </div>
      </header>
      <div className={styles.conversation} role="log" aria-live="polite">
        {assistant.messages.length === 0 ? (
          <ChatEmptyState
            onPick={(value) => {
              setImageMode(false);
              setInput(value);
            }}
          />
        ) : (
          <div className={styles.messages}>
            {assistant.messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? styles.userMessage
                    : styles.aiMessage
                }
              >
                {message.role === "assistant" && (
                  <div className={styles.turnHeader}>
                    <span>
                      <Icon name="spark" width={15} />
                    </span>
                    <strong>Resilix</strong>
                    {message.model && <small>{message.model}</small>}
                  </div>
                )}
                <p>{message.text}</p>
                {message.cards?.map((card, index) => (
                  <StructuredCard
                    key={`${message.id}-${index}`}
                    card={card}
                    sourceLabel={t("source")}
                  />
                ))}
              </article>
            ))}
          </div>
        )}
        {assistant.busy && (
          <div className={styles.busy}>
            <span />
            <span />
            <span />
            {t("thinking")}
          </div>
        )}
        {assistant.error && (
          <p className={styles.error} role="alert">
            {t(assistant.error)}
          </p>
        )}
        <div ref={end} />
      </div>
      <div className={styles.composerArea}>
        {voice.state !== "idle" && (
          <div className={styles.voiceBar}>
            <div className={styles.voiceAnimation}>
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <span>
              {t(voice.state === "live" ? "listening" : "voiceConnecting")}
            </span>
            <button
              type="button"
              onClick={voice.stop}
              aria-label={t("endVoice")}
            >
              <Icon name="stop" width={16} />
            </button>
          </div>
        )}
        {voice.error && (
          <p className={styles.error} role="alert">
            {t("voiceError")}
          </p>
        )}
        {imageMode && (
          <div className={styles.modeNote}>
            <Icon name="image" width={15} />
            {t("imageNotice")}
            <button
              type="button"
              onClick={() => setImageMode(false)}
              aria-label={t("close")}
            >
              <Icon name="close" width={14} />
            </button>
          </div>
        )}
        <Composer
          value={input}
          onChange={setInput}
          onSend={send}
          busy={assistant.busy}
          placeholder={t(imageMode ? "imagePrompt" : "message")}
          sendLabel={t("send")}
          hint={t("chatHint")}
        >
          <button
            type="button"
            className={`${styles.tool} ${imageMode ? styles.activeTool : ""}`}
            onClick={() => setImageMode(!imageMode)}
            title={t("image")}
            aria-label={t("image")}
            aria-pressed={imageMode}
          >
            <Icon name="image" width={19} />
          </button>
          <button
            type="button"
            className={styles.tool}
            onClick={() => startVoice("dictation")}
            title={t(
              voice.state !== "idle" && voiceMode === "dictation"
                ? "endDictation"
                : "dictation",
            )}
            aria-label={t("dictation")}
          >
            <Icon name="mic" width={18} />
          </button>
          <button
            type="button"
            className={`${styles.tool} ${voice.state !== "idle" && voiceMode === "voice" ? styles.activeTool : ""}`}
            onClick={() => startVoice("voice")}
            title={t(voice.state !== "idle" ? "endVoice" : "voice")}
            aria-label={t("voice")}
          >
            <Icon name="wave" width={19} />
          </button>
          <span className={styles.toolSeparator} />
          <select
            className={styles.modelSelector}
            value={model}
            aria-label={t("model")}
            title={t("model")}
            onChange={(event) => setModel(event.target.value)}
          >
            <option value="auto">{t("auto")}</option>
            {textModels.map((value) => (
              <option
                key={value.id}
                value={value.id}
                disabled={!value.available}
              >
                {value.id}
                {!value.available ? ` · ${t("unavailable")}` : ""}
              </option>
            ))}
          </select>
        </Composer>
      </div>
    </section>
  );
}
