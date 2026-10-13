interface DurableObjectStub {
  fetch(input: Request): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStub;
}

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  JOIN_ALLOWED_ORIGIN?: string;
  DISCORD_INVITE_URL?: string;
  RATE_LIMIT_HMAC_SECRET?: string;
  JOIN_RATE_LIMITER?: DurableObjectNamespace;
}

interface PagesContext {
  request: Request;
  env: Env;
}

const MAX_BODY_BYTES = 2048;
const VERIFY_TIMEOUT_MS = 5000;
const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const securityHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Security-Policy":
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; connect-src https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; script-src https://challenges.cloudflare.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Strict-Transport-Security": "max-age=31536000",
};

function respond(
  status: number,
  body: Record<string, string>,
  extraHeaders?: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: { ...securityHeaders, ...extraHeaders },
  });
}

function parseAllowedOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.origin !== value ||
      url.username ||
      url.password
    )
      return null;
    return url;
  } catch {
    return null;
  }
}

function validInvite(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "discord.gg" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !/^\/[A-Za-z0-9-]{2,32}$/.test(url.pathname)
    )
      return null;
    return url.toString();
  } catch {
    return null;
  }
}

async function readLimitedBody(request: Request): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

async function rateLimitKey(ip: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function verifyTurnstile(
  secret: string,
  token: string,
  hostname: string,
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const form = new URLSearchParams({ secret, response: token });
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: form,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return false;
    const verification = result as {
      success?: unknown;
      hostname?: unknown;
      action?: unknown;
      "error-codes"?: unknown;
    };
    return (
      verification.success === true &&
      verification.hostname === hostname &&
      verification.action === "discord_join"
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  if (request.method !== "POST") {
    return respond(405, { error: "method_not_allowed" }, { Allow: "POST" });
  }

  const allowedOrigin = parseAllowedOrigin(env.JOIN_ALLOWED_ORIGIN);
  if (
    !allowedOrigin ||
    request.headers.get("Origin") !== allowedOrigin.origin
  ) {
    return respond(403, { error: "origin_not_allowed" });
  }
  if (
    request.headers.get("Content-Type")?.split(";")[0]?.trim() !==
    "application/json"
  ) {
    return respond(415, { error: "unsupported_media_type" });
  }
  const contentLength = Number(request.headers.get("Content-Length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) {
    return respond(413, { error: "payload_too_large" });
  }

  if (
    !env.TURNSTILE_SECRET_KEY?.trim() ||
    !env.RATE_LIMIT_HMAC_SECRET?.trim() ||
    new TextEncoder().encode(env.RATE_LIMIT_HMAC_SECRET).byteLength < 32 ||
    !env.JOIN_RATE_LIMITER
  ) {
    return respond(503, { error: "service_unavailable" });
  }
  const ip = request.headers.get("cf-connecting-ip");
  if (!ip || ip.length > 64) {
    return respond(503, { error: "service_unavailable" });
  }

  try {
    const key = await rateLimitKey(ip, env.RATE_LIMIT_HMAC_SECRET);
    const id = env.JOIN_RATE_LIMITER.idFromName(key);
    const limiter = env.JOIN_RATE_LIMITER.get(id);
    const limitResponse = await limiter.fetch(
      new Request("https://join-rate-limit.internal/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    );
    if (!limitResponse.ok)
      return respond(503, { error: "service_unavailable" });
    const limitResult: unknown = await limitResponse.json();
    if (!limitResult || typeof limitResult !== "object") {
      return respond(503, { error: "service_unavailable" });
    }
    const limit = limitResult as { allowed?: unknown; retryAfter?: unknown };
    if (limit.allowed !== true) {
      const retryAfter = Number.isInteger(limit.retryAfter)
        ? Math.max(1, Math.min(60, Number(limit.retryAfter)))
        : 10;
      return respond(
        429,
        { error: "rate_limited" },
        { "Retry-After": String(retryAfter) },
      );
    }
  } catch {
    return respond(503, { error: "service_unavailable" });
  }

  let body: unknown;
  try {
    const raw = await readLimitedBody(request);
    if (raw === null) {
      return respond(413, { error: "payload_too_large" });
    }
    body = JSON.parse(raw);
  } catch {
    return respond(400, { error: "invalid_request" });
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "token") ||
    typeof (body as { token?: unknown }).token !== "string"
  ) {
    return respond(400, { error: "invalid_request" });
  }
  const token = (body as { token: string }).token;
  if (token.length < 1 || token.length > 2048) {
    return respond(400, { error: "invalid_request" });
  }

  if (
    !(await verifyTurnstile(
      env.TURNSTILE_SECRET_KEY!,
      token,
      allowedOrigin.hostname,
    ))
  ) {
    return respond(403, { error: "verification_failed" });
  }
  const inviteUrl = validInvite(env.DISCORD_INVITE_URL);
  if (!inviteUrl) return respond(503, { error: "service_unavailable" });
  return respond(200, { inviteUrl });
}
