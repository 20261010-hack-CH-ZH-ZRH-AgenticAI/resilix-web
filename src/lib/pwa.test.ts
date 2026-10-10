import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

test("service worker never intercepts API data or POST requests", () => {
  const listeners: Record<string, (event: unknown) => void> = {};
  let intercepted = false;
  runInNewContext(
    readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"),
    {
      self: {
        location: { origin: "https://resilix.example" },
        addEventListener: (name: string, handler: (event: unknown) => void) => {
          listeners[name] = handler;
        },
      },
      URL,
    },
  );
  for (const [method, path] of [
    ["GET", "/api/alerts/personal"],
    ["POST", "/api/chat"],
    ["GET", "https://third-party.example/secret"],
  ]) {
    const url = path.startsWith("http")
      ? path
      : `https://resilix.example${path}`;
    listeners.fetch({
      request: { method, url },
      respondWith: () => {
        intercepted = true;
      },
    });
  }
  expect(intercepted).toBe(false);
});

test("authenticated navigation is network-only and is never written to cache", async () => {
  const listeners: Record<string, (event: unknown) => void> = {};
  let response: Promise<unknown> | undefined;
  let writes = 0;
  runInNewContext(
    readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"),
    {
      self: {
        location: { origin: "https://resilix.example" },
        addEventListener: (name: string, handler: (event: unknown) => void) => {
          listeners[name] = handler;
        },
      },
      URL,
      fetch: async () => ({ status: 200, body: "private page" }),
      caches: {
        open: async () => {
          writes++;
        },
        match: async () => ({ status: 200, body: "public offline page" }),
      },
    },
  );
  listeners.fetch({
    request: {
      method: "GET",
      url: "https://resilix.example/app",
      mode: "navigate",
    },
    respondWith: (promise: Promise<unknown>) => {
      response = promise;
    },
  });
  expect(await response).toEqual({ status: 200, body: "private page" });
  expect(writes).toBe(0);
});
