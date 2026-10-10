import { Icon, VoiceOrb } from "@resilix/ui-components";
import type { AudioSegment } from "@/lib/api/audio";
import type { ChatLabels } from "./chatLabels";
import styles from "./VoiceControlsStyles.module.css";
export function VoiceControls({
  labels: l,
  state,
  muted,
  speaking,
  onToggle,
  onMute,
  analysis,
  onAnalysis,
  segments,
  analysisError,
  readAloud,
  onReadAloud,
}: {
  labels: ChatLabels;
  state: "idle" | "connecting" | "live";
  muted: boolean;
  speaking: boolean;
  onToggle: () => void;
  onMute: () => void;
  analysis: boolean;
  onAnalysis: (value: boolean) => void;
  segments: AudioSegment[];
  analysisError: boolean;
  readAloud: boolean;
  onReadAloud: (value: boolean) => void;
}) {
  const orbState =
    state === "idle"
      ? "idle"
      : state === "connecting"
        ? "connecting"
        : muted
          ? "muted"
          : speaking
            ? "speaking"
            : "listening";
  return (
    <section className={styles.focus} aria-label={l.voiceTitle}>
      <VoiceOrb
        state={orbState}
        label={state === "idle" ? l.voiceStart : l.voiceEnd}
        caption={
          state === "idle"
            ? l.voiceIdle
            : state === "connecting"
              ? l.voiceConnecting
              : muted
                ? l.voiceMuted
                : speaking
                  ? l.voiceSpeaking
                  : l.voiceListening
        }
        onToggle={onToggle}
      />
      <div className={styles.toolbar}>
        {state !== "idle" && (
          <button
            type="button"
            onClick={onMute}
            aria-pressed={muted}
            title={muted ? l.unmute : l.mute}
          >
            <Icon name="mic" width={16} />
            {muted ? l.unmute : l.mute}
          </button>
        )}
        <label>
          <input
            type="checkbox"
            checked={readAloud}
            onChange={(event) => onReadAloud(event.target.checked)}
          />
          {l.voicePlayback}
        </label>
        <label>
          <input
            type="checkbox"
            checked={analysis}
            disabled={state !== "idle"}
            onChange={(event) => onAnalysis(event.target.checked)}
          />
          {l.speakerConsent}
        </label>
      </div>
      <p className={styles.notice}>{l.voicePrivacy}</p>
      <details className={styles.settings}>
        <summary>
          <Icon name="shield" width={12} />
          {l.noise}
        </summary>
        <p>{l.noiseHint}</p>
      </details>
      {analysis && (segments.length > 0 || analysisError) && (
        <div className={styles.speakers}>
          <strong>{l.speakers}</strong>
          <p>{analysisError ? l.speakerUnavailable : l.speakerHint}</p>
          <div>
            {segments.slice(-8).map((segment, index) => (
              <span key={`${segment.start}-${index}`}>
                {segment.speaker} · {segment.start.toFixed(1)}–
                {segment.end.toFixed(1)}s
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
