import { z } from "zod";
import { request } from "./client";

export const AudioSegmentSchema = z.object({
  speaker: z.string(),
  start: z.number(),
  end: z.number(),
  text: z.string().optional(),
  overlap: z.boolean().optional(),
});
export type AudioSegment = z.infer<typeof AudioSegmentSchema>;
export const DiarizationSchema = z
  .object({
    session_id: z.string(),
    segments: z.array(AudioSegmentSchema).default([]),
  })
  .passthrough();
export const speech = (text: string, entity: string, language: string) =>
  request(
    "speech",
    z.object({
      audio_base64: z.string(),
      mime_type: z.string(),
      model: z.string(),
      voice: z.string(),
      is_generated: z.literal(true),
    }),
    { text, entity, language },
  );
export const transcribeClip = (
  audio_base64: string,
  mime_type: string,
  language: string,
) =>
  request(
    "audio-transcribe",
    z.object({
      text: z.string(),
      segments: z.array(AudioSegmentSchema).default([]),
      diarization: z.unknown().optional(),
    }),
    { audio_base64, mime_type, language },
  );
export const diarizeChunk = (
  audio_base64: string,
  session_id?: string,
  final = false,
) =>
  request("diarize", DiarizationSchema, {
    audio_base64,
    mime_type: "audio/pcm",
    sample_rate: 16000,
    session_id,
    final,
  });

export async function blobBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let start = 0; start < bytes.length; start += 8192)
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(binary);
}
export function audioBlobUrl(encoded: string, mimeType: string): string {
  if (
    !/^audio\/(wav|x-wav|mpeg|mp3|ogg|webm|mp4|aac|flac)(;.*)?$/i.test(mimeType)
  )
    throw new Error("Unsupported audio format");
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}
