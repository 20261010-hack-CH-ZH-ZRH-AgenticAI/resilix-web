import { z } from "zod";
import { request } from "./client";

export const EntityRoleSchema = z.enum([
  "manager",
  "police",
  "fire",
  "medical",
  "notifications",
  "instagram",
  "fundraising",
]);
export type EntityRole = z.infer<typeof EntityRoleSchema>;
export const IncidentMessageSchema = z.object({
  id: z.string(),
  task_id: z.string().nullish(),
  role: z.string(),
  text: z.string(),
  revision: z.number(),
  created_at: z.string(),
  is_simulation: z.literal(true),
  status: z.enum(["current", "superseded"]).default("current"),
  superseded: z.boolean().default(false),
});
export const IncidentTaskSchema = z.object({
  id: z.string(),
  role: EntityRoleSchema,
  title: z.string(),
  status: z.enum([
    "queued",
    "running",
    "completed",
    "failed",
    "superseded",
    "cancelled",
  ]),
  revision: z.number(),
  result: z.unknown().optional(),
  error: z.string().nullish(),
  phase: z.string().optional(),
});
export const IncidentTraceSchema = z.object({
  id: z.string(),
  task_id: z.string().nullish(),
  type: z.string(),
  revision: z.number(),
  created_at: z.string(),
  data: z.unknown(),
});
export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  language: z.string(),
  status: z.enum([
    "queued",
    "running",
    "paused",
    "completed",
    "failed",
    "cancelled",
  ]),
  revision: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  is_simulation: z.literal(true),
  version: z.number().default(0),
  tasks: z.array(IncidentTaskSchema).default([]),
  messages: z.array(IncidentMessageSchema).default([]),
  traces: z.array(IncidentTraceSchema).default([]),
});
export type Incident = z.infer<typeof IncidentSchema>;
export type IncidentMessage = z.infer<typeof IncidentMessageSchema>;
export type SteeringAction = "update" | "pause" | "resume" | "cancel";
const Envelope = z.object({ incident: IncidentSchema });
export const listIncidents = () =>
  request("incidents", z.object({ incidents: z.array(IncidentSchema) }));
export const getIncident = (id: string) =>
  request(`incidents/${encodeURIComponent(id)}`, Envelope);
export const createIncident = (
  title: string,
  description: string,
  language: string,
) =>
  request("incidents", Envelope, {
    title,
    description,
    language,
    is_simulation: true,
  });
export const steerIncident = (
  id: string,
  message: string,
  action: SteeringAction = "update",
) =>
  request(`incidents/${encodeURIComponent(id)}/steer`, Envelope, {
    message,
    action,
  });
