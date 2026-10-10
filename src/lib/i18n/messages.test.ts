import { expect, test } from "bun:test";
import { slidesFor } from "@/features/deck/content";
import { languages, messages } from "./messages";

test("every UI message has a nonempty translation in each supported language", () => {
  for (const value of Object.values(messages)) {
    expect(value.length).toBe(languages.length);
    expect(value.every((text) => text.trim().length > 0)).toBe(true);
  }
});
test("the complete deck exists in all four languages with source boundaries", () => {
  for (const language of languages) {
    const slides = slidesFor(language);
    expect(slides.length).toBe(9);
    expect(
      slides.every(
        (slide) =>
          slide.title && slide.body && slide.points.length && slide.footnote,
      ),
    ).toBe(true);
  }
});
