"use client";
import { ActionButton, Badge, Icon } from "@resilix/ui-components";
import { RoutePlanner } from "@/features/maps/RoutePlanner";
import type { Model } from "@/lib/api/client";
import { ChatComposer } from "./ChatComposer";
import styles from "./ChatWorkspaceStyles.module.css";
import { ClipPreview } from "./ClipPreview";
import { ResponsePanel } from "./ResponsePanel";
import { Transcript } from "./Transcript";
import { useChatWorkspace } from "./useChatWorkspace";
import { VoiceControls } from "./VoiceControls";
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
  const {
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
  } = useChatWorkspace({ prompt, active, onPromptUsed });
  return (
    <section className={styles.workspace}>
      <header className={styles.header}>
        <div className={styles.identity}>
          <Icon name="spark" />
          <strong>{t("assistant")}</strong>
          <Badge tone="lime">Resilix</Badge>
        </div>
        <div className={styles.headerTools}>
          <select
            className={styles.provider}
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
              speech.stop();
              assistant.clear();
              setHidden(new Set(messages.map((message) => message.id)));
              setInput("");
            }}
          >
            <Icon name="plus" />
          </ActionButton>
        </div>
      </header>
      <div className={styles.layout}>
        <div className={styles.main}>
          <VoiceControls
            labels={l}
            state={voice.state}
            muted={voice.muted}
            speaking={voice.speaking || Boolean(speech.playing)}
            onToggle={() => startVoice("voice")}
            onMute={voice.toggleMute}
            analysis={analysis}
            onAnalysis={setAnalysis}
            segments={diarization.segments}
            analysisError={diarization.error}
            readAloud={readAloud}
            onReadAloud={setReadAloud}
          />
          <div className={styles.conversation}>
            {!messages.length && (
              <div className={styles.greeting}>
                <h1>{l.voiceTitle}</h1>
                <p>{t("chatBody")}</p>
                <div className={styles.suggestions}>
                  <button type="button" onClick={() => setInput(t("prompt1"))}>
                    {t("prepare")}
                  </button>
                  <button type="button" onClick={newExercise}>
                    {l.startIncident}
                  </button>
                </div>
              </div>
            )}
            <Transcript
              messages={messages}
              labels={l}
              language={language}
              speech={speech}
              sourceLabel={t("source")}
              end={end}
            />
            {assistant.busy && (
              <output className={styles.busy}>{t("thinking")}</output>
            )}
          </div>
          {visibleError && (
            <p className={styles.error} role="alert">
              {t(visibleError)}
            </p>
          )}
          {voice.error && (
            <p className={styles.error} role="alert">
              {t("voiceError")}
            </p>
          )}
          {speech.error && (
            <p className={styles.error} role="alert">
              {l.audioError}
            </p>
          )}
          <ClipPreview
            recorder={recorder}
            busy={clipBusy}
            onSend={() => void sendClip()}
            labels={l}
          />
          <ChatComposer
            input={input}
            onInput={setInput}
            onSend={() => void send()}
            busy={
              clipBusy ||
              (mode === "response" ? incidents.busy : assistant.busy)
            }
            imageMode={imageMode}
            onImage={() => {
              setMode("assistant");
              setImageMode(!imageMode);
            }}
            model={model}
            onModel={setModel}
            models={models}
            mode={mode}
            onMode={setMode}
            creating={creating || !incidents.incident}
            title={title}
            onTitle={setTitle}
            onDictation={() => startVoice("dictation")}
            onRecord={() => {
              if (recorder.recording) recorder.stop();
              else {
                stopAll();
                void recorder.start();
              }
            }}
            recording={recorder.recording}
            labels={l}
            t={t}
          />
        </div>
        <aside className={styles.side}>
          <ResponsePanel
            controller={incidents}
            labels={l}
            language={language}
            traces={tools.traces}
            onNew={newExercise}
          />
          <RoutePlanner compact />
        </aside>
      </div>
    </section>
  );
}
