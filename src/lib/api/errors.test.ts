import { expect, test } from "bun:test";
import { languages, translations } from "@/lib/i18n/messages";
import { ApiError } from "./client";
import { apiErrorKey } from "./errors";

test("API statuses select actionable translated messages without exposing server text", () => {
  const cases = [
    [400, "errorInvalidInput"],
    [413, "errorInvalidInput"],
    [422, "errorInvalidInput"],
    [401, "errorAuthentication"],
    [403, "errorForbidden"],
    [404, "errorNotFound"],
    [409, "errorConflict"],
    [429, "errorRateLimit"],
    [500, "errorUnavailable"],
    [502, "errorUnavailable"],
    [503, "errorUnavailable"],
    [418, "errorUnknown"],
  ] as const;
  const privateDetail =
    "Sensitive upstream diagnostic that must never be rendered";
  for (const [status, expected] of cases) {
    const key = apiErrorKey(new ApiError(status, privateDetail));
    expect(key).toBe(expected);
    for (const language of languages) {
      expect(translations[language][key].length).toBeGreaterThan(0);
      expect(translations[language][key]).not.toContain(privateDetail);
      if (language !== "en")
        expect(translations[language][key]).not.toBe(translations.en[key]);
    }
  }
});

test("network and unknown errors retain uncertainty instead of asserting unchanged state", () => {
  expect(apiErrorKey(new TypeError("Failed to fetch"))).toBe("networkError");
  expect(apiErrorKey(new Error("Untrusted server text"))).toBe("errorUnknown");
  expect(apiErrorKey({ status: 401, message: "Spoofed object" })).toBe(
    "errorUnknown",
  );
  expect(translations.en.errorUnknown).toContain("verify");
});
