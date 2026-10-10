import { expect, test } from "bun:test";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { createTransportServer } from "./websocket-proxy.mjs";

async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Listener unavailable");
  return address.port;
}
async function close(server: Server) {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

test("API WebSockets survive a competing Next upgrade listener and queue an immediate frame", async () => {
  const upstreamHttp = createServer();
  const upstreamWs = new WebSocketServer({ noServer: true });
  let forwardedCookie = "";
  let otherUpgrade = false;
  upstreamHttp.on("upgrade", (request, socket, head) => {
    forwardedCookie = request.headers.cookie ?? "";
    setTimeout(
      () =>
        upstreamWs.handleUpgrade(request, socket, head, (ws) => {
          ws.on("message", (data) => ws.send(data));
        }),
      30,
    );
  });
  const upstreamPort = await listen(upstreamHttp);
  const proxy = createTransportServer(
    (_req: IncomingMessage, res: ServerResponse) => res.end("ok"),
    `http://127.0.0.1:${upstreamPort}`,
  );
  proxy.on("upgrade", (_req, socket) => {
    otherUpgrade = true;
    socket.destroy();
  });
  const port = await listen(proxy);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/api/events`, {
    headers: {
      Origin: `http://127.0.0.1:${port}`,
      Cookie: "resilix_session=synthetic-test-token",
    },
  });
  try {
    const reply = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Proxy reply timeout")),
        3000,
      );
      socket.once("open", () => socket.send('{"type":"ping"}'));
      socket.once("message", (data) => {
        clearTimeout(timer);
        resolve(data.toString());
      });
      socket.once("error", reject);
    });
    expect(reply).toBe('{"type":"ping"}');
    expect(otherUpgrade).toBe(false);
    expect(forwardedCookie).toBe("resilix_session=synthetic-test-token");
  } finally {
    socket.terminate();
    for (const client of upstreamWs.clients) client.terminate();
    await close(proxy);
    await close(upstreamHttp);
    upstreamWs.close();
  }
});
