import type { MapPosition } from "@resilix/ui-canvas";
import { z } from "zod";
import { ApiError, request } from "@/lib/api/client";

const positionSchema = z.object({
  latitude: z.number().finite().min(-85).max(85),
  longitude: z.number().finite().min(-180).max(180),
});
export const routeSchema = z.object({
  id: z.string(),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z
      .array(
        z.tuple([
          z.number().finite().min(-180).max(180),
          z.number().finite().min(-85).max(85),
        ]),
      )
      .min(2)
      .max(20_000),
  }),
  distance_m: z.number().finite().nonnegative(),
  duration_s: z.number().finite().nonnegative(),
  profile: z.enum(["foot", "bike", "car"]),
  generated_at: z.string(),
  origin: positionSchema,
  destination: positionSchema,
  steps: z.array(
    z.object({
      type: z.string(),
      modifier: z.string(),
      name: z.string(),
      distance_m: z.number().nonnegative(),
      duration_s: z.number().nonnegative(),
    }),
  ),
  provenance: z.object({
    provider: z.string(),
    attribution: z.string(),
    attribution_url: z.string().url(),
    fix_map_url: z.string().url(),
    privacy_url: z.string().url(),
    usage_policy_url: z.string().url(),
    data_version: z.string().nullable(),
    safety_assessed: z.literal(false),
    live_closures_checked: z.literal(false),
    coordinates_retained_by_resilix: z.literal(false),
    provider_may_log_coordinates: z.literal(true),
  }),
});
export type RouteResult = z.infer<typeof routeSchema>;
export type RouteProfile = "foot" | "bike" | "car";
export interface RouteArgs {
  origin?: MapPosition;
  destination?: MapPosition;
  profile?: RouteProfile;
}
export interface CoordinateFields {
  latitude: string;
  longitude: string;
}
export const emptyCoordinates: CoordinateFields = {
  latitude: "",
  longitude: "",
};

export class MapRequestError extends Error {
  constructor(
    public code: "consentRequired" | "invalidCoordinates" | "cancelled",
  ) {
    super(code);
  }
}
export function readCoordinates(value: CoordinateFields): MapPosition {
  if (!value.latitude.trim() || !value.longitude.trim())
    throw new MapRequestError("invalidCoordinates");
  const result = positionSchema.safeParse({
    latitude: Number(value.latitude),
    longitude: Number(value.longitude),
  });
  if (!result.success) throw new MapRequestError("invalidCoordinates");
  return result.data;
}
export function routeInput(
  args: RouteArgs,
  origin: CoordinateFields,
  destination: CoordinateFields,
  consent: boolean,
  profile: RouteProfile,
) {
  if (!consent) throw new MapRequestError("consentRequired");
  const start = args.origin
    ? positionSchema.safeParse(args.origin)
    : positionSchema.safeParse(readCoordinates(origin));
  const end = args.destination
    ? positionSchema.safeParse(args.destination)
    : positionSchema.safeParse(readCoordinates(destination));
  if (!start.success || !end.success)
    throw new MapRequestError("invalidCoordinates");
  return {
    origin: start.data,
    destination: end.data,
    profile: args.profile ?? profile,
    share_with_routing_provider: true,
  };
}
export async function calculateRoute(input: ReturnType<typeof routeInput>) {
  const result = await request(
    "routes",
    z.object({ route: routeSchema }),
    input,
  );
  return result.route;
}
export function routeErrorKey(error: unknown) {
  if (error instanceof MapRequestError) return error.code;
  if (error instanceof ApiError) {
    if (error.status === 429) return "routeBusy";
    if (error.status === 422) return "noRoute";
    if (error.status === 400) return "invalidCoordinates";
    if (error.status === 401 || error.status === 403) return "signInAgain";
  }
  return "routeUnavailable";
}
