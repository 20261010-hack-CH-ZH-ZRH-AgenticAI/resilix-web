import { z } from "zod";

const coordinate = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();
export const toolSchemas = {
  start_crisis_response: z
    .object({
      title: z.string().min(1).max(180),
      description: z.string().min(1).max(6000),
      language: z.enum(["en", "es", "de", "fr"]),
    })
    .strict(),
  steer_crisis_response: z
    .object({
      incident_id: z.string().min(1),
      message: z.string().max(6000),
      action: z.enum(["update", "pause", "resume", "cancel"]),
    })
    .strict(),
  inspect_crisis_response: z
    .object({ incident_id: z.string().min(1) })
    .strict(),
  plan_evacuation_route: z
    .object({
      origin: coordinate,
      destination: coordinate,
      profile: z.enum(["foot", "bike", "car"]),
    })
    .strict(),
  generate_preparedness_image: z
    .object({ prompt: z.string().min(1).max(4000) })
    .strict(),
};
export type ToolName = keyof typeof toolSchemas;
export function parseTool(name: string, args: unknown) {
  if (!(name in toolSchemas)) throw new Error("Tool not supported");
  return toolSchemas[name as ToolName].parse(args);
}
