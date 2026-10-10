import { getConfig } from "@/lib/config";
export function GET() {
  const config = getConfig();
  return Response.json(
    {
      mapTileUrl: config.mapTileUrl,
      mapAttribution: config.mapAttribution ?? "Map source unconfigured",
      mapAttributionUrl: config.mapAttributionUrl,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
