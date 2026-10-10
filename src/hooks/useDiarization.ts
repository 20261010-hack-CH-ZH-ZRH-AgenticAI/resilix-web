"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { type AudioSegment, diarizeChunk } from "@/lib/api/audio";
import { encodePcm16 } from "@/lib/realtime/pcm";

interface AnalysisStream {
  context: AudioContext;
  processor: ScriptProcessorNode;
  input: MediaStreamAudioSourceNode;
  buffer: Float32Array[];
  samples: number;
  session?: string;
  queue: Promise<void>;
  stopped: boolean;
  pending: number;
}
export function useDiarization() {
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [error, setError] = useState(false);
  const stream = useRef<AnalysisStream | undefined>(undefined);
  const generation = useRef(0);
  const submit = useCallback(
    (
      current: AnalysisStream,
      samples: Float32Array,
      final: boolean,
      active: number,
    ) => {
      current.pending++;
      current.queue = current.queue.then(async () => {
        try {
          if (!samples.length && !current.session) return;
          const result = await diarizeChunk(
            samples.length ? encodePcm16(samples) : "",
            current.session,
            final,
          );
          current.session = result.session_id;
          if (active === generation.current) setSegments(result.segments);
        } catch {
          if (active === generation.current) setError(true);
        } finally {
          current.pending--;
        }
      });
    },
    [],
  );
  const stop = useCallback(() => {
    const current = stream.current;
    if (!current || current.stopped) return;
    current.stopped = true;
    stream.current = undefined;
    current.processor.disconnect();
    current.input.disconnect();
    const samples = new Float32Array(current.samples);
    let offset = 0;
    for (const chunk of current.buffer) {
      samples.set(chunk, offset);
      offset += chunk.length;
    }
    submit(current, samples, true, generation.current);
    void current.context.close();
  }, [submit]);
  const start = useCallback(
    (input: MediaStream) => {
      stop();
      const active = ++generation.current;
      setSegments([]);
      setError(false);
      try {
        const context = new AudioContext({ sampleRate: 16000 });
        const source = context.createMediaStreamSource(input);
        const processor = context.createScriptProcessor(4096, 1, 1);
        const mute = context.createGain();
        mute.gain.value = 0;
        source.connect(processor);
        processor.connect(mute);
        mute.connect(context.destination);
        const current: AnalysisStream = {
          context,
          processor,
          input: source,
          buffer: [],
          samples: 0,
          queue: Promise.resolve(),
          stopped: false,
          pending: 0,
        };
        stream.current = current;
        processor.onaudioprocess = (event) => {
          if (current.stopped) return;
          if (current.pending >= 4) {
            setError(true);
            stop();
            return;
          }
          const chunk = new Float32Array(event.inputBuffer.getChannelData(0));
          current.buffer.push(chunk);
          current.samples += chunk.length;
          if (current.samples < 32000) return;
          const samples = new Float32Array(current.samples);
          let offset = 0;
          for (const item of current.buffer) {
            samples.set(item, offset);
            offset += item.length;
          }
          current.buffer = [];
          current.samples = 0;
          submit(current, samples, false, active);
        };
        void context.resume().catch(() => setError(true));
      } catch {
        setError(true);
      }
    },
    [stop, submit],
  );
  useEffect(
    () => () => {
      stop();
      generation.current++;
    },
    [stop],
  );
  return { segments, error, start, stop };
}
