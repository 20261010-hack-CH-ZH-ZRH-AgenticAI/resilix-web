import { expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

test("audio policy permits browser-owned recording and replay blobs without allowing remote media", () => {
  const response = proxy(new NextRequest("http://localhost:3000/app"));
  const policy = response.headers.get("Content-Security-Policy") ?? "";
  const media = policy
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("media-src"));
  expect(media).toBe("media-src 'self' blob:");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("Permissions-Policy")).toContain(
    "microphone=(self)",
  );
});
