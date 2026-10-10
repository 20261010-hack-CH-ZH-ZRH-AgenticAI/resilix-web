import { z } from "zod";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullish(),
  is_demo: z.boolean().optional(),
});
const SessionSchema = z.object({ user: UserSchema, csrf_token: z.string() });
export const AlertSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(""),
  category: z.string().default("general"),
  severity: z.union([z.string(), z.number()]).transform(String),
  location: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  source_url: z.string().nullish(),
  source_name: z.string().nullish(),
  observed_at: z.string().nullish(),
  created_at: z.string().nullish(),
  is_simulation: z.boolean().default(false),
  visibility: z.enum(["public", "personal"]),
  status: z.string().default("active"),
});
export type User = z.infer<typeof UserSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export const CardSchema = z.object({
  type: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  description: z.string().optional(),
  items: z
    .array(
      z.union([
        z.string(),
        z.object({
          label: z.string().optional(),
          value: z.string().optional(),
          text: z.string().optional(),
        }),
      ]),
    )
    .optional(),
  steps: z.array(z.string()).optional(),
  severity: z.string().optional(),
  source_url: z.string().optional(),
  source: z.string().optional(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })).optional(),
  image_url: z.string().optional(),
});
const ModelSchema = z.object({
  id: z.string(),
  available: z.boolean(),
  purpose: z.union([z.string(), z.array(z.string())]).optional(),
});
export type Model = z.infer<typeof ModelSchema>;
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let csrfToken = "";
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data: unknown = await response.json();
  if (!response.ok) {
    const error = z
      .object({
        error: z
          .union([z.string(), z.object({ message: z.string() })])
          .optional(),
        message: z.string().optional(),
      })
      .safeParse(data);
    const details = error.success
      ? error.data.message ||
        (typeof error.data.error === "string"
          ? error.data.error
          : error.data.error?.message)
      : undefined;
    throw new ApiError(
      response.status,
      details ?? "Request could not be completed",
    );
  }
  return schema.parse(data);
}
export async function authenticate(
  mode: "demo" | "login" | "register",
  body: unknown = {},
) {
  const session = await request(`auth/${mode}`, SessionSchema, body);
  csrfToken = session.csrf_token;
  return session.user;
}
export async function getSession() {
  const session = await request("auth/session", SessionSchema);
  csrfToken = session.csrf_token;
  return session.user;
}
export async function logout() {
  await request("auth/logout", z.unknown(), {});
  csrfToken = "";
}
export const FeedSchema = z.object({
  status: z.string(),
  checked_at: z.string().optional(),
  source: z.string().optional(),
  sources: z
    .array(
      z.object({
        source: z.string(),
        status: z.string(),
        count: z.number().optional(),
        checked_at: z.string().optional(),
        scope: z.string().optional(),
      }),
    )
    .default([]),
});
export type Feed = z.infer<typeof FeedSchema>;
export function getAlerts(personal = false) {
  return request(
    personal ? "alerts/personal" : "alerts",
    z.object({ alerts: z.array(AlertSchema), feed: FeedSchema.optional() }),
  );
}
export function createAlert(body: unknown) {
  return request("alerts/personal", z.object({ alert: AlertSchema }), body);
}
export function deleteAlert(id: string) {
  return request(
    `alerts/personal/${encodeURIComponent(id)}`,
    z.unknown(),
    {},
    "DELETE",
  );
}
export function getModels() {
  return request("models", z.object({ models: z.array(ModelSchema) }));
}
export function sendChat(
  message: string,
  model: string,
  language: string,
  history: { role: string; content: string }[],
) {
  return request(
    "chat",
    z.object({
      text: z.string(),
      cards: z.array(CardSchema).default([]),
      model: z.string(),
    }),
    { message, model, language, history },
  );
}
export function generateImage(prompt: string) {
  return request(
    "images",
    z.object({
      image_base64: z.string().optional(),
      mime_type: z.string().optional(),
      image_url: z.string().optional(),
      b64_json: z.string().optional(),
      data: z
        .array(
          z.object({
            url: z.string().optional(),
            b64_json: z.string().optional(),
          }),
        )
        .optional(),
      model: z.string().optional(),
    }),
    { prompt },
  );
}
export function realtimeSession(
  language: string,
  mode: "voice" | "dictation" = "voice",
) {
  return request(
    mode === "dictation" ? "transcribe" : "realtime/session",
    z.object({
      client_secret: z.object({ value: z.string() }),
      model: z.string(),
      calls_url: z.string().url(),
    }),
    { language },
  );
}
export const PublicConfigSchema = z.object({
  mapTileUrl: z.string().optional(),
  mapAttribution: z.string(),
  mapAttributionUrl: z.string().optional(),
});
export type PublicConfig = z.infer<typeof PublicConfigSchema>;
export function getPublicConfig() {
  return request("config", PublicConfigSchema);
}
export function safeSource(value?: string | null) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}
