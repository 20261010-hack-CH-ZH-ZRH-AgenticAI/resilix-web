import { Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

// Next installs its own upgrade listener lazily. Route our transport before
// EventEmitter broadcasts the upgrade, so exactly one handler owns each socket.
class RoutedServer extends Server {
  emit(event, ...args) {
    if (event === "upgrade" && args[0].url === "/api/events")
      return super.emit("resilix-upgrade", ...args);
    return super.emit(event, ...args);
  }
}

function sameOrigin(request) {
  try {
    return (
      Boolean(request.headers.origin) &&
      new URL(request.headers.origin).host === request.headers.host
    );
  } catch {
    return false;
  }
}

function bridge(client, upstream) {
  const pending = [];
  let queuedBytes = 0;
  upstream.on("open", () => {
    for (const frame of pending)
      upstream.send(frame.data, { binary: frame.binary });
    pending.length = 0;
    queuedBytes = 0;
  });
  upstream.on("message", (data, binary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary });
  });
  client.on("message", (data, binary) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(data, { binary });
    else if (upstream.readyState === WebSocket.CONNECTING) {
      queuedBytes += data.length;
      if (queuedBytes > 65536 || pending.length >= 16) client.close(1009);
      else pending.push({ data, binary });
    }
  });
  upstream.on("close", () => client.close());
  client.on("close", () => upstream.close());
  upstream.on("error", () => client.close(1011));
  client.on("error", () => upstream.close());
}

export function createTransportServer(handler, apiBaseUrl) {
  const server = new RoutedServer(handler);
  const upgrades = new WebSocketServer({ noServer: true, maxPayload: 65536 });
  server.on("resilix-upgrade", (request, socket, head) => {
    if (!apiBaseUrl || !sameOrigin(request)) {
      socket.destroy();
      return;
    }
    const upstreamUrl = new URL("/api/events", apiBaseUrl);
    upstreamUrl.protocol = upstreamUrl.protocol === "https:" ? "wss:" : "ws:";
    upgrades.handleUpgrade(request, socket, head, (client) => {
      const upstream = new WebSocket(upstreamUrl, {
        headers: {
          cookie: request.headers.cookie ?? "",
          origin: request.headers.origin,
        },
        maxPayload: 65536,
        handshakeTimeout: 10000,
      });
      bridge(client, upstream);
    });
  });
  return server;
}
