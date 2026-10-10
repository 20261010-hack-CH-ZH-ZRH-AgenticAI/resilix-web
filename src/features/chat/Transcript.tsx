import {
  EntityMessage,
  type EntityMessageProps,
  StructuredCard,
} from "@resilix/ui-chat";
import { Icon } from "@resilix/ui-components";
import type { RefObject } from "react";
import type { useSpeechPlayback } from "@/hooks/useSpeechPlayback";
import type { EntityRole } from "@/lib/api/incidents";
import type { ChatLabels } from "./chatLabels";
import styles from "./TranscriptStyles.module.css";
import type { ConversationMessage } from "./useAssistant";

const roles: Record<
  EntityRole,
  { emblem: string; tone: EntityMessageProps["tone"] }
> = {
  manager: { emblem: "R", tone: "lime" },
  police: { emblem: "P", tone: "purple" },
  fire: { emblem: "F", tone: "danger" },
  medical: { emblem: "+", tone: "lime" },
  notifications: { emblem: "!", tone: "warning" },
  instagram: { emblem: "@", tone: "purple" },
  fundraising: { emblem: "↗", tone: "warning" },
};
export function Transcript({
  messages,
  labels: l,
  language,
  speech,
  sourceLabel,
  end,
}: {
  messages: ConversationMessage[];
  labels: ChatLabels;
  language: string;
  speech: ReturnType<typeof useSpeechPlayback>;
  sourceLabel: string;
  end: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      className={styles.transcript}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => {
        const role = message.entity ? roles[message.entity] : undefined;
        const user = message.role === "user";
        return (
          <div key={message.id} className={user ? styles.user : styles.reply}>
            <EntityMessage
              name={
                user
                  ? message.source
                    ? l.audioInput
                    : l.you
                  : message.entity
                    ? l[message.entity]
                    : "Resilix"
              }
              emblem={
                user ? (
                  <Icon name={message.source ? "mic" : "chat"} width={16} />
                ) : (
                  (role?.emblem ?? <Icon name="spark" width={16} />)
                )
              }
              tone={role?.tone ?? (user ? "neutral" : "lime")}
              simulationLabel={
                message.isSimulation && !user
                  ? `${l.simulation}${message.superseded ? ` · ${l.superseded}` : ""}`
                  : undefined
              }
              timeLabel={
                message.createdAt
                  ? new Date(message.createdAt).toLocaleTimeString(language, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : undefined
              }
              actions={
                !user && message.text ? (
                  <>
                    <button
                      type="button"
                      className={styles.replay}
                      disabled={speech.loading === message.id}
                      onClick={() =>
                        speech.playing === message.id
                          ? speech.stop()
                          : speech.play(message)
                      }
                    >
                      <Icon
                        name={speech.playing === message.id ? "stop" : "wave"}
                        width={14}
                      />
                      {speech.loading === message.id
                        ? l.audioLoading
                        : speech.playing === message.id
                          ? l.audioStop
                          : l.replay}
                    </button>
                    <span className={styles.audioLabel}>
                      {l.generatedAudio}
                    </span>
                    {message.model && (
                      <span className={styles.audioLabel}>{message.model}</span>
                    )}
                  </>
                ) : undefined
              }
            >
              <p>{message.text}</p>
              {message.audioUrl && (
                <audio
                  controls
                  preload="none"
                  src={message.audioUrl}
                  aria-label={l.clipPlayback}
                >
                  <track kind="captions" />
                </audio>
              )}
              {message.segments && message.segments.length > 0 && (
                <details className={styles.segments}>
                  <summary>{l.speakers}</summary>
                  <p>{l.speakerHint}</p>
                  {message.segments.map((segment, index) => (
                    <p key={`${segment.start}-${index}`}>
                      <strong>{segment.speaker}</strong> ·{" "}
                      {segment.start.toFixed(1)}–{segment.end.toFixed(1)}s{" "}
                      {segment.overlap && <em>{l.overlap} · </em>}
                      {segment.text}
                    </p>
                  ))}
                </details>
              )}
              {message.cards?.map((card, index) => (
                <StructuredCard
                  key={`${message.id}-${index}`}
                  card={card}
                  sourceLabel={sourceLabel}
                />
              ))}
            </EntityMessage>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}
