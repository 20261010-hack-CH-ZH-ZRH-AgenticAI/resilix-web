import { expect, test } from "bun:test";
import { completeOpenAITool, routeToolResult } from "./toolBridge";
import { parseTool } from "./tools";

test("voice tools accept the same bounded incident inputs and cannot grant routing consent", () => {
  expect(
    parseTool("start_crisis_response", {
      title: "Drill",
      description: "Fictional exercise",
      language: "de",
    }),
  ).toEqual({
    title: "Drill",
    description: "Fictional exercise",
    language: "de",
  });
  expect(() =>
    parseTool("start_crisis_response", {
      title: "Drill",
      description: "Fictional exercise",
      language: "en",
      is_simulation: false,
    }),
  ).toThrow();
  expect(() =>
    parseTool("plan_evacuation_route", {
      origin: { latitude: 47, longitude: 8 },
      destination: { latitude: 47.1, longitude: 8.1 },
      profile: "foot",
      share_with_routing_provider: true,
    }),
  ).toThrow();
  expect(() => parseTool("dispatch_police", {})).toThrow();
});
test("realtime function completion sends actual output before requesting the spoken answer", async () => {
  const sent: Record<string, unknown>[] = [];
  const output = await completeOpenAITool(
    {
      name: "inspect_crisis_response",
      arguments: '{"incident_id":"owned"}',
      call_id: "call-1",
    },
    async (_name, args) => ({
      ok: true,
      result: { ...(args as object), status: "running" },
    }),
    {
      readyState: "open",
      send: (value) => {
        sent.push(JSON.parse(value));
      },
    },
    () => true,
  );
  expect(output).toEqual({
    ok: true,
    result: { incident_id: "owned", status: "running" },
  });
  expect(sent.map((item) => item.type)).toEqual([
    "conversation.item.create",
    "response.create",
  ]);
  expect((sent[0].item as Record<string, string>).call_id).toBe("call-1");
  expect(JSON.parse((sent[0].item as Record<string, string>).output)).toEqual(
    output,
  );
});
test("malformed arguments produce failure output; a closed session performs no tool", async () => {
  let calls = 0;
  const sent: string[] = [];
  const execute = async () => {
    calls++;
    return { ok: true };
  };
  const channel = {
    readyState: "open",
    send: (value: string) => {
      sent.push(value);
    },
  };
  const bad = await completeOpenAITool(
    { name: "inspect_crisis_response", arguments: "{", call_id: "bad" },
    execute,
    channel,
    () => true,
  );
  expect(bad).toMatchObject({ ok: false, error: "tool_failed" });
  expect(calls).toBe(0);
  expect(sent).toHaveLength(2);
  const closed = await completeOpenAITool(
    { name: "start_crisis_response", arguments: "{}", call_id: "closed" },
    execute,
    channel,
    () => false,
  );
  expect(closed).toEqual({ ok: false, error: "session_closed" });
  expect(calls).toBe(0);
});
test("route result sent to voice provider excludes coordinates and geometry", () => {
  const route = {
    origin: { latitude: 47, longitude: 8 },
    destination: { latitude: 47.1, longitude: 8.1 },
    geometry: {
      coordinates: [
        [8, 47],
        [8.1, 47.1],
      ],
    },
    distance_m: 300,
    duration_s: 200,
    profile: "foot",
    provenance: { provider: "FOSSGIS OSRM" },
  };
  expect(routeToolResult(route)).toEqual({
    status: "preview_ready",
    distance_m: 300,
    duration_s: 200,
    profile: "foot",
    provider: "FOSSGIS OSRM",
    safety_assessed: false,
  });
  expect(JSON.stringify(routeToolResult(route))).not.toContain("47");
});
