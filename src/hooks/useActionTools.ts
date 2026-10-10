"use client";
import type { ActivityEntry } from "@resilix/ui-chat";
import { useCallback, useRef, useState } from "react";
import type { useAssistant } from "@/features/chat/useAssistant";
import { MapRequestError, type RouteResult } from "@/features/maps/route-api";
import { generateImage } from "@/lib/api/client";
import { apiErrorKey } from "@/lib/api/errors";
import { routeToolResult } from "@/lib/realtime/toolBridge";
import { toolSchemas } from "@/lib/realtime/tools";
import type { useIncident } from "./useIncident";

type RouteArgs = {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  profile: "foot" | "bike" | "car";
};
export function useActionTools(
  incident: ReturnType<typeof useIncident>,
  assistant: ReturnType<typeof useAssistant>,
  planRoute: (args: RouteArgs) => Promise<RouteResult>,
  onResponse: () => void,
  imageLabel: string,
) {
  const [traces, setTraces] = useState<ActivityEntry[]>([]);
  const handlers = useRef({
    incident,
    assistant,
    planRoute,
    onResponse,
    imageLabel,
  });
  handlers.current = { incident, assistant, planRoute, onResponse, imageLabel };
  const pending = useRef(new Map<string, Promise<unknown>>());
  const execute = useCallback(
    (name: string, input: unknown, id: string): Promise<unknown> => {
      const prior = pending.current.get(id);
      if (prior) return prior;
      const run = async () => {
        setTraces((old) => [
          ...old,
          {
            id,
            label: name,
            status: "running",
            details: JSON.stringify({ arguments: input }, null, 2),
            time: new Date().toISOString(),
          },
        ]);
        let output: unknown;
        try {
          if (!(name in toolSchemas)) throw new Error("Unknown tool");
          const h = handlers.current;
          let result: unknown;
          if (name === "start_crisis_response") {
            const args = toolSchemas.start_crisis_response.parse(input);
            h.onResponse();
            result = await h.incident.start(
              args.title,
              args.description,
              args.language,
            );
          } else if (name === "steer_crisis_response") {
            const args = toolSchemas.steer_crisis_response.parse(input);
            h.onResponse();
            result = await h.incident.steer(
              args.message,
              args.action,
              args.incident_id,
            );
          } else if (name === "inspect_crisis_response") {
            result = await h.incident.inspect(
              toolSchemas.inspect_crisis_response.parse(input).incident_id,
            );
            h.onResponse();
          } else if (name === "plan_evacuation_route") {
            const route = await h.planRoute(
              toolSchemas.plan_evacuation_route.parse(input),
            );
            result = routeToolResult(route);
          } else {
            const args = toolSchemas.generate_preparedness_image.parse(input);
            const image = await generateImage(args.prompt);
            const data =
              image.image_base64 ?? image.b64_json ?? image.data?.[0]?.b64_json;
            if (!data) throw new Error("Image response missing");
            h.assistant.append("assistant", h.imageLabel, {
              model: image.model,
              cards: [
                {
                  type: "image",
                  title: args.prompt,
                  image_url: `data:image/png;base64,${data}`,
                },
              ],
            });
            result = {
              generated: true,
              is_illustration: true,
              model: image.model,
            };
          }
          output = { ok: true, result };
        } catch (reason) {
          output = {
            ok: false,
            error:
              reason instanceof MapRequestError
                ? reason.code
                : apiErrorKey(reason),
            instruction:
              "Do not claim success. Inspect current state or ask the user to complete the required UI consent.",
          };
        }
        const successful = (output as { ok: boolean }).ok;
        setTraces((old) =>
          old.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: successful ? "completed" : "failed",
                  details: JSON.stringify(
                    { arguments: input, output },
                    null,
                    2,
                  ).slice(0, 16000),
                }
              : entry,
          ),
        );
        return output;
      };
      const promise = run();
      pending.current.set(id, promise);
      return promise;
    },
    [],
  );
  return { execute, traces };
}
