import next from "next";
import { runtimeConfig } from "./runtime-config.mjs";
import { createTransportServer } from "./websocket-proxy.mjs";

const app = next({ dev: process.argv.includes("--dev") });
await app.prepare();
const config = runtimeConfig();
if (!config.port || !config.hostname)
  throw new Error("PORT and HOSTNAME are required");
const server = createTransportServer(
  app.getRequestHandler(),
  config.apiBaseUrl,
);
server.listen(config.port, config.hostname, () =>
  console.info("Resilix web listening", { port: config.port }),
);
