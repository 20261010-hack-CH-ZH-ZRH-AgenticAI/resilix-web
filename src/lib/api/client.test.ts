import { expect, test } from "bun:test";
import { AlertSchema, CardSchema, safeSource } from "./client";

test("malformed alert ownership and unbounded map positions fail closed at input", () => {
  expect(
    AlertSchema.safeParse({
      id: "x",
      title: "Report",
      severity: "low",
      visibility: "unknown",
    }).success,
  ).toBe(false);
  expect(
    AlertSchema.safeParse({
      id: "x",
      title: "Report",
      severity: "low",
      visibility: "personal",
      latitude: "private",
    }).success,
  ).toBe(false);
});
test("injected source schemes cannot be emitted as links", () => {
  expect(safeSource("javascript:alert(1)")).toBeUndefined();
  expect(safeSource("data:text/html,test")).toBeUndefined();
  expect(safeSource("https://www.slf.ch/")).toBe("https://www.slf.ch/");
});
test("cards accept documented source references without arbitrary HTML interpretation", () => {
  expect(
    CardSchema.parse({
      type: "checklist",
      title: "Preparation",
      items: ["Check reports"],
      sources: [{ title: "SLF", url: "https://www.slf.ch/" }],
    }).sources?.length,
  ).toBe(1);
});
