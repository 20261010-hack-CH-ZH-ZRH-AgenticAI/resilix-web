import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { IncidentSchema } from "@/lib/api/incidents";
import { chatLabels } from "./chatLabels";
import { Transcript } from "./Transcript";

test("voice, clip, team and speaker controls have complete four-language copy", () => {
  const keys = Object.keys(chatLabels.en).sort();
  for (const language of ["en", "es", "de", "fr"] as const) {
    expect(Object.keys(chatLabels[language]).sort()).toEqual(keys);
    for (const value of Object.values(chatLabels[language]))
      expect(value.trim().length).toBeGreaterThan(0);
  }
});
test("a responder message visibly identifies simulation, superseded context and uncertain overlapping speakers", () => {
  const html = renderToStaticMarkup(
    <Transcript
      messages={[
        {
          id: "test",
          role: "assistant",
          text: "Exercise advice",
          entity: "police",
          isSimulation: true,
          superseded: true,
          segments: [
            {
              speaker: "Speaker1",
              start: 0,
              end: 1,
              text: "Recognized text",
              overlap: true,
            },
          ],
        },
      ]}
      labels={chatLabels.en}
      language="en"
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
  expect(html).toContain("Police liaison");
  expect(html).toContain("Simulation · Superseded");
  expect(html).toContain("Generated voice");
  expect(html).toContain("Overlapping voices · uncertain attribution");
  expect(html).toContain("Speaker numbers do not identify people");
});
test("incident responses fail closed when a provider claims real dispatch instead of simulation", () => {
  const incident = {
    id: "test",
    title: "Drill",
    description: "Fictional only",
    language: "en",
    status: "running",
    revision: 2,
    version: 5,
    created_at: "2026-10-10T00:00:00Z",
    updated_at: "2026-10-10T00:00:01Z",
    is_simulation: true,
    tasks: [],
    messages: [
      {
        id: "message",
        task_id: "task",
        role: "manager",
        text: "Old plan",
        revision: 1,
        created_at: "2026-10-10T00:00:00Z",
        is_simulation: true,
        status: "superseded",
        superseded: true,
      },
    ],
    traces: [],
  };
  const parsed = IncidentSchema.parse(incident);
  expect(parsed.version).toBe(5);
  expect(parsed.messages[0].superseded).toBe(true);
  expect(
    IncidentSchema.safeParse({ ...incident, is_simulation: false }).success,
  ).toBe(false);
  expect(
    IncidentSchema.safeParse({
      ...incident,
      messages: [{ ...incident.messages[0], is_simulation: false }],
    }).success,
  ).toBe(false);
});
