import { expect, test } from "bun:test";
import { decodePcm16, encodePcm16 } from "./pcm";

test("PCM16 conversion clips microphone samples and preserves signed little-endian amplitudes", () => {
  const result = decodePcm16(
    encodePcm16(new Float32Array([-2, -1, -0.5, 0, 0.5, 1, 2])),
  );
  expect(result.length).toBe(7);
  expect(result[0]).toBe(-1);
  expect(result[2]).toBeCloseTo(-0.5, 4);
  expect(result[4]).toBeCloseTo(0.5, 4);
  expect(result[6]).toBeCloseTo(1, 4);
});
