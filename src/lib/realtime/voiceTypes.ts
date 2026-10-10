export const microphoneConstraints: MediaTrackConstraints = {
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};
export interface TranscriptMeta {
  id?: string;
  source?: "voice" | "dictation";
}
export type TranscriptHandler = (
  role: "user" | "assistant",
  text: string,
  meta?: TranscriptMeta,
) => void;
export interface VoiceOptions {
  executeTool?: (
    name: string,
    args: unknown,
    callId: string,
  ) => Promise<unknown>;
  onMicrophone?: (stream: MediaStream) => void;
  onMicrophoneStop?: () => void;
  context?: string;
}
