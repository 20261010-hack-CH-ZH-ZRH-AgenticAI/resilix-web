import { type NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const config = getConfig();
  const allowed = config.cspConnectOrigins
    .split(/\s+/)
    .filter((value) => /^(https|wss):\/\/[a-zA-Z0-9.-]+(:\d+)?$/.test(value));
  const tileOrigin = config.mapTileUrl ? new URL(config.mapTileUrl).origin : "";
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: ${tileOrigin}`,
    `media-src 'self' blob:`,
    `font-src 'self'`,
    `connect-src 'self' ${allowed.join(" ")}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `report-uri /api/csp-report`,
  ].join("; ");
  const incoming = new Headers(request.headers);
  incoming.set("x-nonce", nonce);
  incoming.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers: incoming } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  // Microphone supports user-started voice; location is read only after an explicit button press.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(self), payment=(), usb=(), browsing-topics=()",
  );
  if (config.production)
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|offline.html).*)",
  ],
};
