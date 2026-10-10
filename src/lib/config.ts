import { runtimeConfig } from "../../runtime-config.mjs";
export function getConfig() {
  const config = runtimeConfig();
  const apiBaseUrl = config.apiBaseUrl ? new URL(config.apiBaseUrl) : undefined;
  if (apiBaseUrl && !["http:", "https:"].includes(apiBaseUrl.protocol))
    throw new Error("API_BASE_URL must use HTTP(S)");
  return { ...config, apiBaseUrl };
}
