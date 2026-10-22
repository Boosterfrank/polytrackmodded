/**
 * Same-origin proxy for PolyTrack's backend (https://vps.kodub.com/), as a Cloudflare Pages Function.
 *
 * PolyTrack's backend only answers requests whose Origin header is one of the game's own origins.
 * The desktop app rewrites that header in electron/main.js; a web build hosted on another domain
 * cannot, so PolyModLoader.js looks for this proxy at ./api/ and, when it answers, sends leaderboard,
 * user-profile and multiplayer-signaling traffic (plain requests and WebSockets) through it.
 *
 * Only paths below /v6/ of the official backend are forwarded, so this is not an open proxy.
 * Set the POLYTRACK_ORIGIN environment variable on the Pages project to change the Origin header
 * that is sent upstream (default: the origin the PolyModLoader desktop app uses).
 */
const UPSTREAM = "https://vps.kodub.com/";
const DEFAULT_ORIGIN = "https://app-polytrack-desktop.polymodloader.com";
const ALLOWED_PREFIX = "v6/";
const PROBE_HEADERS = { "X-PolyTrack-Proxy": "1", "Cache-Control": "no-store" };

export async function onRequest({ request, params, env }) {
  const segments = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
  const path = segments.join("/");

  // Probe used by PolyModLoader.js to detect the proxy.
  if (path === "") return new Response(null, { status: 204, headers: PROBE_HEADERS });
  if (!path.startsWith(ALLOWED_PREFIX)) return new Response("Not found", { status: 404 });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });

  const upstreamUrl = new URL(path + new URL(request.url).search, UPSTREAM);
  const upstreamRequest = new Request(upstreamUrl.href, request);
  for (const name of ["cookie", "referer", "cf-connecting-ip", "x-forwarded-for", "x-real-ip", "x-forwarded-proto", "x-forwarded-host"]) {
    upstreamRequest.headers.delete(name);
  }
  upstreamRequest.headers.set("Origin", env?.POLYTRACK_ORIGIN || DEFAULT_ORIGIN);

  const upstream = await fetch(upstreamRequest, { redirect: "manual" });
  // A WebSocket upgrade (multiplayer signaling) has to be returned untouched.
  if (upstream.status === 101) return upstream;

  const headers = new Headers(upstream.headers);
  for (const [name, value] of Object.entries(corsHeaders(request))) headers.set(name, value);
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
}

function corsHeaders(request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("Origin") || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "Content-Type",
    "Vary": "Origin",
  };
}
