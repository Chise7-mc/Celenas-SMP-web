// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequest, type JoinEnvironment } from "../functions/api/join";

const origin = "https://join.example";
const invite = "https://discord.gg/example-invite";
const now = new Date("2026-10-13T00:00:00Z");
const environment: JoinEnvironment = {
  RECAPTCHA_SECRET_KEY: "synthetic-test-secret",
  JOIN_ALLOWED_ORIGIN: origin,
  DISCORD_INVITE_URL: invite,
};

function request(body: unknown = { token: "synthetic-token" }) {
  return new Request(`${origin}/api/join`, {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function googleResponse(overrides: Record<string, unknown> = {}) {
  return Response.json({
    success: true,
    hostname: "join.example",
    challenge_ts: "2026-10-12T23:59:30Z",
    ...overrides,
  });
}

describe("participation verification API", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("reveals the configured invitation only after Google's verification", async () => {
    const upstream = vi.fn(async (_url: unknown, options?: RequestInit) => {
      const fields = options?.body as URLSearchParams;
      expect(fields.get("secret")).toBe("synthetic-test-secret");
      expect(fields.get("response")).toBe("synthetic-token");
      expect(fields.has("remoteip")).toBe(false);
      expect(_url).toBe("https://www.google.com/recaptcha/api/siteverify");
      return googleResponse();
    });
    vi.stubGlobal("fetch", upstream);
    const response = await onRequest({ request: request(), env: environment });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: invite });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it.each([
    {},
    { token: "" },
    { token: 1 },
    { token: null },
    { token: "x".repeat(4097) },
    null,
  ])("rejects invalid tokens before contacting Google: %j", async (body) => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await onRequest({
      request: request(body),
      env: environment,
    });
    expect(response.status).toBe(400);
    expect(await response.json()).not.toHaveProperty("url");
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each(["GET", "HEAD", "OPTIONS", "PUT"])(
    "rejects method %s",
    async (method) => {
      const response = await onRequest({
        request: new Request(`${origin}/api/join`, { method }),
        env: environment,
      });
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("POST");
    },
  );

  it.each([null, "https://elsewhere.example", "null"])(
    "rejects origin %s",
    async (value) => {
      const input = request();
      if (value === null) input.headers.delete("Origin");
      else input.headers.set("Origin", value);
      const response = await onRequest({ request: input, env: environment });
      expect(response.status).toBe(403);
    },
  );

  it("rejects a request served on an unconfigured hostname", async () => {
    const input = new Request("https://preview.example/api/join", request());
    expect((await onRequest({ request: input, env: environment })).status).toBe(
      403,
    );
  });

  it.each([
    { RECAPTCHA_SECRET_KEY: "" },
    { JOIN_ALLOWED_ORIGIN: "" },
    { JOIN_ALLOWED_ORIGIN: "http://join.example" },
    { JOIN_ALLOWED_ORIGIN: "https://user:password@join.example" },
    { JOIN_ALLOWED_ORIGIN: `${origin}/subpath` },
    { DISCORD_INVITE_URL: "" },
    { DISCORD_INVITE_URL: "https://elsewhere.example/invite" },
    { DISCORD_INVITE_URL: "https://discord.gg.evil.example/invite" },
    { DISCORD_INVITE_URL: "https://discord.com/login" },
    { DISCORD_INVITE_URL: "https://discord.gg/invite?redirect=elsewhere" },
    { DISCORD_INVITE_URL: "https://user:password@discord.gg/invite" },
  ])("fails closed for invalid configuration: %j", async (override) => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await onRequest({
      request: request(),
      env: { ...environment, ...override },
    });
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("url");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects non-JSON and broken JSON bodies", async () => {
    const input = request();
    input.headers.set("content-type", "text/plain");
    expect((await onRequest({ request: input, env: environment })).status).toBe(
      415,
    );
    const broken = new Request(`${origin}/api/join`, {
      method: "POST",
      headers: { Origin: origin, "Content-Type": "application/json" },
      body: "{",
    });
    expect(
      (await onRequest({ request: broken, env: environment })).status,
    ).toBe(400);
  });

  it("limits actual streamed bytes even with a false Content-Length", async () => {
    const input = new Request(`${origin}/api/join`, {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        "Content-Length": "1",
      },
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(8193));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: string });
    const response = await onRequest({ request: input, env: environment });
    expect(response.status).toBe(413);
    expect(await response.json()).not.toHaveProperty("url");
  });

  it.each([
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: "true" },
    { hostname: "elsewhere.example" },
    { challenge_ts: "2026-10-13T00:00:01Z" },
    { challenge_ts: "broken" },
    { challenge_ts: null },
  ])(
    "rejects Google's unsuccessful or mismatched response: %j",
    async (data) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => googleResponse(data)),
      );
      const response = await onRequest({
        request: request(),
        env: environment,
      });
      expect(response.status).toBe(403);
      expect(await response.json()).not.toHaveProperty("url");
    },
  );

  it("requires a fresh Google verification on every request", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(googleResponse())
        .mockResolvedValueOnce(
          googleResponse({
            success: false,
            "error-codes": ["timeout-or-duplicate"],
          }),
        ),
    );
    expect(
      (await onRequest({ request: request(), env: environment })).status,
    ).toBe(200);
    const replay = await onRequest({ request: request(), env: environment });
    expect(replay.status).toBe(403);
    expect(await replay.json()).not.toHaveProperty("url");
  });

  it("accepts a fresh valid token even when solving the challenge took longer than two minutes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        googleResponse({ challenge_ts: "2026-10-12T23:55:00Z" }),
      ),
    );
    const response = await onRequest({ request: request(), env: environment });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ url: invite });
  });

  it.each([
    () => new Response("not JSON"),
    () => new Response("unavailable", { status: 503 }),
    () => Response.json(null),
  ])("fails closed on an invalid upstream response", async (createResponse) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => createResponse()),
    );
    const response = await onRequest({ request: request(), env: environment });
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("url");
  });

  it("bounds the verification request to five seconds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: unknown, options?: RequestInit) =>
          new Promise((_resolve, reject) => {
            options?.signal?.addEventListener(
              "abort",
              () => reject(new Error("timeout")),
              { once: true },
            );
          }),
      ),
    );
    const pending = onRequest({ request: request(), env: environment });
    await vi.advanceTimersByTimeAsync(5000);
    const response = await pending;
    expect(response.status).toBe(503);
    expect(await response.json()).not.toHaveProperty("url");
  });
});
