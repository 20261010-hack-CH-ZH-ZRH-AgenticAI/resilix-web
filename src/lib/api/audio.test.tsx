import { expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { chatLabels } from "@/features/chat/chatLabels";
import { Transcript } from "@/features/chat/Transcript";
import { AudioSegmentSchema, transcribeClip } from "./audio";

test("core-shaped overlapping clip segments retain null text and visible attribution uncertainty", async () => {
  const coreResponse = {
    text: "The full recording transcript remains available.",
    segments: [
      {
        speaker: "Speaker1",
        start: 0,
        end: 2,
        text: null,
        alignment: "unresolved" as const,
        overlap: true,
      },
      {
        speaker: "Speaker2",
        start: 1,
        end: 3,
        text: null,
        alignment: "unresolved" as const,
        overlap: true,
      },
    ],
    diarization: { status: "completed", identity_verified: false },
    retained_audio: false,
  };
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(coreResponse),
  );
  try {
    const result = await transcribeClip("c3ludGhldGlj", "audio/wav", "en");
    expect(result.text).toBe(coreResponse.text);
    expect(result.segments).toEqual(coreResponse.segments);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/audio-transcribe");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.cache).toBe("no-store");
    for (const language of ["en", "es", "de", "fr"] as const) {
      const labels = chatLabels[language];
      const html = renderToStaticMarkup(
        <Transcript
          messages={[
            {
              id: "clip",
              role: "user",
              text: result.text,
              segments: result.segments,
            },
          ]}
          labels={labels}
          language={language}
          sourceLabel="Source"
          speech={{
            playing: undefined,
            loading: undefined,
            error: false,
            play: () => {},
            stop: () => {},
          }}
          end={{ current: null }}
        />,
      );
      expect(html).toContain(coreResponse.text);
      expect(html).toContain(labels.overlap);
      expect(html).toContain(labels.speakerHint);
      expect(html).not.toContain(">null<");
    }
  } finally {
    fetch.mockRestore();
  }
});

test("core-shaped clips beyond the segment alignment limit retain the full transcript", async () => {
  const segments = Array.from({ length: 17 }, (_, index) => ({
    speaker: `Speaker${(index % 2) + 1}`,
    start: index,
    end: index + 0.5,
    text: null,
    alignment: "unresolved" as const,
    overlap: false,
  }));
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      text: "Complete transcript without fabricated per-speaker alignment.",
      segments,
    }),
  );
  try {
    const result = await transcribeClip("c3ludGhldGlj", "audio/wav", "en");
    expect(result.text).toBe(
      "Complete transcript without fabricated per-speaker alignment.",
    );
    expect(result.segments).toEqual(segments);
    expect(
      AudioSegmentSchema.safeParse({ ...segments[0], text: 42 }).success,
    ).toBe(false);
  } finally {
    fetch.mockRestore();
  }
});
