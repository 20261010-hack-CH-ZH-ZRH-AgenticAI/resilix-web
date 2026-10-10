import { expect, spyOn, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { createAlert, sendChat } from "@/lib/api/client";
import { PreferencesProvider } from "@/lib/i18n/Provider";
import { Chat } from "./chat/Chat";
import { PersonalAlertDialog } from "./dashboard/PersonalAlertDialog";
import { MapWorkspaceProvider } from "./maps/MapWorkspaceProvider";

test("the default chat selection sends auto routing and the requested language", async () => {
  const html = renderToStaticMarkup(
    <PreferencesProvider>
      <MapWorkspaceProvider
        alerts={[]}
        personal={[]}
        config={{ mapAttribution: "swisstopo" }}
      >
        <Chat models={[]} prompt="" active onPromptUsed={() => {}} />
      </MapWorkspaceProvider>
    </PreferencesProvider>,
  );
  const modelSelect = html.match(
    /<select[^>]*aria-label="Choose model"[^>]*>(.*?)<\/select>/,
  );
  const selected = modelSelect?.[1].match(
    /<option value="([^"]+)" selected="">/,
  );
  expect(selected?.[1]).toBe("auto");
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      text: "A preparation checklist",
      cards: [],
      model: "gpt-6-astra",
    }),
  );
  try {
    await sendChat("Prepare a drill", selected?.[1] ?? "", "de", []);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(JSON.parse(String(init?.body))).toEqual({
      message: "Prepare a drill",
      model: "auto",
      language: "de",
      history: [],
    });
    expect(init?.credentials).toBe("same-origin");
    expect(init?.cache).toBe("no-store");
  } finally {
    fetch.mockRestore();
  }
});

test("the Moderate personal-alert choice sends the backend moderate severity", async () => {
  const html = renderToStaticMarkup(
    <PreferencesProvider>
      <PersonalAlertDialog
        open={false}
        onClose={() => {}}
        onCreated={() => {}}
      />
    </PreferencesProvider>,
  );
  const moderate = html.match(
    /<option value="([^"]+)"[^>]*>Moderate<\/option>/,
  );
  expect(moderate?.[1]).toBe("moderate");
  const fetch = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({
      alert: {
        id: "test",
        title: "Drill",
        severity: "moderate",
        visibility: "personal",
      },
    }),
  );
  try {
    await createAlert({
      title: "Drill",
      description: "Fictional test",
      severity: moderate?.[1],
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/alerts/personal");
    expect(JSON.parse(String(init?.body)).severity).toBe("moderate");
  } finally {
    fetch.mockRestore();
  }
});

test("clearing the view discloses that saved conversation context remains", () => {
  const html = renderToStaticMarkup(
    <PreferencesProvider>
      <MapWorkspaceProvider
        alerts={[]}
        personal={[]}
        config={{ mapAttribution: "swisstopo" }}
      >
        <Chat models={[]} prompt="" active onPromptUsed={() => {}} />
      </MapWorkspaceProvider>
    </PreferencesProvider>,
  );
  expect(html).toContain('aria-label="Clear view"');
  expect(html).toContain(
    "Saved account conversation context remains available to the assistant.",
  );
});

test("text model choices exclude non-text capabilities without relying on model names", () => {
  const models = [
    { id: "gpt-6-astra", purpose: "reasoning", available: true },
    { id: "gpt-5.6-luna", purpose: "fast", available: true },
    { id: "gpt-5.6-terra", purpose: ["balanced"], available: true },
    { id: "gemini-3.8-flash", purpose: "backup", available: false },
    {
      id: "nvidia/Nemotron-3-Diarization",
      purpose: "speaker_segmentation",
      available: true,
    },
    { id: "future-audio-model", purpose: "voice", available: true },
    { id: "future-asr-model", purpose: "transcription", available: true },
    { id: "future-visual-model", purpose: "image", available: true },
    { id: "unspecified-model", available: true },
  ];
  const html = renderToStaticMarkup(
    <PreferencesProvider>
      <MapWorkspaceProvider
        alerts={[]}
        personal={[]}
        config={{ mapAttribution: "swisstopo" }}
      >
        <Chat models={models} prompt="" active onPromptUsed={() => {}} />
      </MapWorkspaceProvider>
    </PreferencesProvider>,
  );
  const select =
    html.match(
      /<select[^>]*aria-label="Choose model"[^>]*>(.*?)<\/select>/,
    )?.[1] ?? "";
  const choices = [...select.matchAll(/<option value="([^"]+)"/g)].map(
    (match) => match[1],
  );
  expect(choices).toEqual([
    "auto",
    "gpt-6-astra",
    "gpt-5.6-luna",
    "gpt-5.6-terra",
    "gemini-3.8-flash",
  ]);
  expect(select).toContain('<option value="gemini-3.8-flash" disabled="">');
});
