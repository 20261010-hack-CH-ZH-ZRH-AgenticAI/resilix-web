import { type NextRequest, NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

const ALLOWED =
  /^(auth\/(demo|login|register|session|logout)|alerts(\/personal(\/[a-zA-Z0-9-]+)?)?|chat|models|images|speech|audio-transcribe|diarize|routes|incidents(\/[a-zA-Z0-9-]+(\/steer)?)?|transcribe|realtime\/session|sources|workflows(\/[a-zA-Z0-9-]+\/decision)?)$/;
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!ALLOWED.test(path))
    return NextResponse.json({ error: "Unknown endpoint" }, { status: 404 });
  const base = getConfig().apiBaseUrl;
  if (!base)
    return NextResponse.json(
      { error: "Backend is not configured" },
      { status: 503 },
    );
  if (!["GET", "HEAD"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && new URL(origin).host !== host)
      return NextResponse.json(
        { error: "Origin not allowed" },
        { status: 403 },
      );
  }
  const headers = new Headers();
  for (const name of ["content-type", "cookie", "x-csrf-token", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > 15_000_000)
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  try {
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer();
    if (body && body.byteLength > 15_000_000)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const response = await fetch(
      new URL(`/api/${path}${request.nextUrl.search}`, base),
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(120_000),
      },
    );
    const outgoing = new Headers({
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of response.headers.getSetCookie())
      outgoing.append("Set-Cookie", cookie);
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    return NextResponse.json(
      { error: "Backend unavailable. Please retry." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
export const DELETE = proxy;
