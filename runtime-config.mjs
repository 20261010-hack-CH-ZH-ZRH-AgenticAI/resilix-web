export function runtimeConfig() {
  return {
    apiBaseUrl: process.env.API_BASE_URL,
    port: Number(process.env.PORT),
    hostname: process.env.HOSTNAME,
    mapTileUrl: process.env.MAP_TILE_URL,
    mapAttribution: process.env.MAP_ATTRIBUTION,
    mapAttributionUrl: process.env.MAP_ATTRIBUTION_URL,
    cspConnectOrigins: process.env.CSP_CONNECT_ORIGINS ?? "",
    production: process.env.NODE_ENV === "production",
  };
}
