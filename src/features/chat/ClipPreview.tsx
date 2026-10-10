import { Icon } from "@resilix/ui-components";
import type { useAudioClip } from "@/hooks/useAudioClip";
import styles from "./ChatWorkspaceStyles.module.css";
import type { ChatLabels } from "./chatLabels";
export function ClipPreview({
  recorder,
  busy,
  onSend,
  labels: l,
}: {
  recorder: ReturnType<typeof useAudioClip>;
  busy: boolean;
  onSend: () => void;
  labels: ChatLabels;
}) {
  if (!recorder.recording && !recorder.clip && !recorder.error) return null;
  return (
    <div className={styles.clip}>
      {recorder.recording && (
        <div className={styles.recording}>
          <i />
          <strong>
            {l.recording} · 0:{String(recorder.seconds).padStart(2, "0")}
          </strong>
          <button type="button" onClick={recorder.stop}>
            {l.recordStop}
          </button>
        </div>
      )}
      {recorder.clip && (
        <>
          <audio controls src={recorder.clip.url} aria-label={l.clipPlayback}>
            <track kind="captions" />
          </audio>
          <div className={styles.clipActions}>
            <button type="button" disabled={busy} onClick={onSend}>
              <Icon name="send" width={15} />
              {busy ? l.clipBusy : l.clipSend}
            </button>
            <button type="button" disabled={busy} onClick={recorder.discard}>
              {l.clipDiscard}
            </button>
          </div>
        </>
      )}
      <p>
        {recorder.error
          ? l.clipError
          : recorder.limited
            ? l.clipLimit
            : l.clipHint}
      </p>
    </div>
  );
}
