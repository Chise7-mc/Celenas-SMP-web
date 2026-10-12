import { parseDiscordInvite } from "../../src/lib/discord-invite";

export type JoinEnvironment = Readonly<{
  RECAPTCHA_SECRET_KEY?: string;
  JOIN_ALLOWED_ORIGIN?: string;
  DISCORD_INVITE_URL?: string;
}>;

function json(data: object, status: number, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(data, { status, headers });
}

function allowedOrigin(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
      ? url
      : null;
  } catch {
    return null;
  }
}

class BodyTooLarge extends Error {}

async function readBody(request: Request): Promise<unknown> {
  const limit = 8192;
  if (Number(request.headers.get("Content-Length")) > limit)
    throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        void reader.cancel().catch(() => {});
        throw new BodyTooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: JoinEnvironment;
}): Promise<Response> {
  if (request.method !== "POST")
    return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  const origin = allowedOrigin(env.JOIN_ALLOWED_ORIGIN);
  const invite = parseDiscordInvite(env.DISCORD_INVITE_URL);
  const secret = env.RECAPTCHA_SECRET_KEY?.trim();
  if (!origin || !invite || !secret) return json({ error: "unavailable" }, 503);
  if (
    request.headers.get("Origin") !== origin.origin ||
    new URL(request.url).origin !== origin.origin
  ) {
    return json({ error: "forbidden" }, 403);
  }
  if (
    request.headers.get("Content-Type")?.split(";")[0]?.trim().toLowerCase() !==
    "application/json"
  ) {
    return json({ error: "unsupported_media_type" }, 415);
  }
  let input: unknown;
  try {
    input = await readBody(request);
  } catch (error) {
    return json(
      { error: "invalid_request" },
      error instanceof BodyTooLarge ? 413 : 400,
    );
  }
  if (
    !isObject(input) ||
    typeof input.token !== "string" ||
    !input.token.trim() ||
    input.token.length > 4096
  ) {
    return json({ error: "invalid_request" }, 400);
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({ secret, response: input.token }),
        signal: controller.signal,
        redirect: "error",
      },
    );
    if (!response.ok) return json({ error: "unavailable" }, 503);
    const verification: unknown = await response.json();
    if (!isObject(verification)) return json({ error: "unavailable" }, 503);
    const timestamp =
      typeof verification.challenge_ts === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        verification.challenge_ts,
      )
        ? Date.parse(verification.challenge_ts)
        : NaN;
    const age = Date.now() - timestamp;
    if (
      verification.success !== true ||
      verification.hostname !== origin.hostname ||
      !Number.isFinite(age) ||
      age < 0
    ) {
      return json({ error: "verification_failed" }, 403);
    }
    return json({ url: invite }, 200);
  } catch {
    return json({ error: "unavailable" }, 503);
  } finally {
    clearTimeout(timeout);
  }
}
