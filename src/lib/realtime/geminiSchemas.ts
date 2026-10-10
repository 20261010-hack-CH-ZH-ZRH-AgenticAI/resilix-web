import { z } from "zod";
export const SessionSchema = z.object({
  provider: z.literal("gemini"),
  model: z.string(),
  client_secret: z.object({ value: z.string() }),
  websocket_url: z.string().url(),
  setup: z.record(z.string(), z.unknown()),
});
export const MessageSchema = z.object({
  toolCall: z
    .object({
      functionCalls: z.array(
        z.object({ id: z.string(), name: z.string(), args: z.unknown() }),
      ),
    })
    .optional(),
  setupComplete: z.unknown().optional(),
  serverContent: z
    .object({
      interrupted: z.boolean().optional(),
      turnComplete: z.boolean().optional(),
      inputTranscription: z.object({ text: z.string() }).optional(),
      outputTranscription: z.object({ text: z.string() }).optional(),
      modelTurn: z
        .object({
          parts: z.array(
            z.object({
              inlineData: z
                .object({ data: z.string(), mimeType: z.string() })
                .optional(),
              text: z.string().optional(),
            }),
          ),
        })
        .optional(),
    })
    .optional(),
});
