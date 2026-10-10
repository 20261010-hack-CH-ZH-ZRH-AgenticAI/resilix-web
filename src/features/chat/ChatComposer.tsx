import { Composer } from "@resilix/ui-chat";
import { Icon } from "@resilix/ui-components";
import type { Model } from "@/lib/api/client";
import type { MessageKey } from "@/lib/i18n/messages";
import styles from "./ChatWorkspaceStyles.module.css";
import type { ChatLabels } from "./chatLabels";

export function ChatComposer({
  input,
  onInput,
  onSend,
  busy,
  imageMode,
  onImage,
  model,
  onModel,
  models,
  mode,
  onMode,
  creating,
  title,
  onTitle,
  onDictation,
  onRecord,
  recording,
  labels: l,
  t,
}: {
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
  busy: boolean;
  imageMode: boolean;
  onImage: () => void;
  model: string;
  onModel: (value: string) => void;
  models: Model[];
  mode: "assistant" | "response";
  onMode: (value: "assistant" | "response") => void;
  creating: boolean;
  title: string;
  onTitle: (value: string) => void;
  onDictation: () => void;
  onRecord: () => void;
  recording: boolean;
  labels: ChatLabels;
  t: (key: MessageKey) => string;
}) {
  const textModels = models.filter((value) =>
    [value.purpose]
      .flat()
      .some((purpose) =>
        ["reasoning", "fast", "balanced", "backup", "chat", "text"].includes(
          purpose ?? "",
        ),
      ),
  );
  return (
    <div className={styles.composer}>
      <div className={styles.modes}>
        <button
          type="button"
          aria-pressed={mode === "assistant"}
          onClick={() => onMode("assistant")}
        >
          <Icon name="spark" width={15} />
          {l.assistantMode}
        </button>
        <button
          type="button"
          aria-pressed={mode === "response"}
          onClick={() => onMode("response")}
        >
          <Icon name="layers" width={15} />
          {l.responseMode}
          <span>{l.simulation}</span>
        </button>
      </div>
      {mode === "response" && creating && (
        <label className={styles.titleInput}>
          {l.incidentName}
          <input
            value={title}
            onChange={(event) => onTitle(event.target.value)}
            maxLength={180}
            placeholder={l.incidentName}
          />
        </label>
      )}
      {imageMode && (
        <p className={styles.hint}>
          <Icon name="image" width={13} />
          {t("imageNotice")}
        </p>
      )}
      <Composer
        value={input}
        onChange={onInput}
        onSend={onSend}
        busy={busy}
        placeholder={
          mode === "response"
            ? l.incidentPlaceholder
            : t(imageMode ? "imagePrompt" : "message")
        }
        sendLabel={
          mode === "response"
            ? creating
              ? l.startIncident
              : l.steer
            : t("send")
        }
        hint={mode === "response" ? l.steerHint : t("chatHint")}
      >
        <button
          type="button"
          className={styles.tool}
          onClick={onImage}
          aria-label={t("image")}
          title={t("image")}
          aria-pressed={imageMode}
        >
          <Icon name="image" width={18} />
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={onDictation}
          aria-label={t("dictation")}
          title={t("dictation")}
        >
          <Icon name="mic" width={18} />
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={onRecord}
          aria-label={recording ? l.recordStop : l.record}
          title={recording ? l.recordStop : l.record}
          aria-pressed={recording}
        >
          <Icon name={recording ? "stop" : "wave"} width={18} />
        </button>
        <select
          className={styles.model}
          value={model}
          onChange={(event) => onModel(event.target.value)}
          aria-label={t("model")}
          title={t("model")}
        >
          <option value="auto">{t("auto")}</option>
          {textModels.map((value) => (
            <option key={value.id} value={value.id} disabled={!value.available}>
              {value.id}
              {!value.available ? ` · ${t("unavailable")}` : ""}
            </option>
          ))}
        </select>
      </Composer>
    </div>
  );
}
