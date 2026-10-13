import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequest } from "../functions/api/join";

const baseEnv: Parameters<typeof onRequest>[0]["env"] = {
  TURNSTILE_SECRET_KEY: "private-test-secret",
  RATE_LIMIT_HMAC_SECRET: "private-hmac-secret-test-value-32bytes",
  JOIN_ALLOWED_ORIGIN: "https://celenas-smp.pages.dev",
  DISCORD_INVITE_URL: "https://discord.gg/cuXPVNccYv",
  JOIN_RATE_LIMITER: {
    idFromName: (name: string) => name,
    get: () => ({
      fetch: async () => Response.json({ allowed: true, retryAfter: 0 }),
    }),
  },
};

function request(
  method = "POST",
  body = JSON.stringify({ token: "test-turnstile-token" }),
  headers: Record<string, string> = {},
) {
  return new Request("https://celenas-smp.pages.dev/api/join", {
    method,
    headers: {
      Origin: "https://celenas-smp.pages.dev",
      "Content-Type": "application/json",
      "cf-connecting-ip": "192.0.2.10",
      ...headers,
    },
    ...(method === "GET" || method === "HEAD" ? {} : { body }),
  });
}

async function call(req: Request, env = baseEnv) {
  return onRequest({ request: req, env });
}

afterEach(() => vi.unstubAllGlobals());

describe("POST /api/join", () => {
  it.each(["GET", "HEAD", "OPTIONS", "PUT"])("rejects %s", async (method) => {
    const response = await call(request(method));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("checks the origin before invoking dependencies", async () => {
    const response = await call(
      request("POST", "{}", { Origin: "https://attacker.invalid" }),
    );
    expect(response.status).toBe(403);
  });

  it("rejects invalid JSON, unexpected fields and oversized bodies", async () => {
    expect((await call(request("POST", "{"))).status).toBe(400);
    expect(
      (
        await call(
          request(
            "POST",
            JSON.stringify({ token: "x", invite: "https://attacker.invalid" }),
          ),
        )
      ).status,
    ).toBe(400);
    expect((await call(request("POST", "x".repeat(2049)))).status).toBe(413);
  });

  it("rejects non-JSON bodies before rate limiting or verification", async () => {
    const response = await call(
      request("POST", "{}", { "Content-Type": "text/plain" }),
    );
    expect(response.status).toBe(415);
  });

  it("fails closed when secrets or the distributed limiter are missing", async () => {
    const missingSecretEnv = { ...baseEnv };
    delete missingSecretEnv.TURNSTILE_SECRET_KEY;
    const response = await call(request(), missingSecretEnv);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private-test-secret");
  });

  it("requires a sufficiently long HMAC secret for rate-limit identity keys", async () => {
    const response = await call(request(), {
      ...baseEnv,
      RATE_LIMIT_HMAC_SECRET: "too-short",
    });
    expect(response.status).toBe(503);
  });

  it("returns 429 with Retry-After before calling Siteverify", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const env = {
      ...baseEnv,
      JOIN_RATE_LIMITER: {
        idFromName: (name: string) => name,
        get: () => ({
          fetch: async () => Response.json({ allowed: false, retryAfter: 7 }),
        }),
      },
    };
    const response = await call(request(), env);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("7");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies Turnstile hostname and returns only the configured Discord invite", async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        expect(String(_input)).toBe(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        );
        expect(new URLSearchParams(String(init?.body)).get("secret")).toBe(
          "private-test-secret",
        );
        expect(new URLSearchParams(String(init?.body)).get("response")).toBe(
          "test-turnstile-token",
        );
        return Response.json({
          success: true,
          hostname: "celenas-smp.pages.dev",
          action: "discord_join",
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await call(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      inviteUrl: "https://discord.gg/cuXPVNccYv",
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
  });

  it("rejects invalid or wrong-hostname verification responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ success: true, hostname: "attacker.invalid" }),
      ),
    );
    const response = await call(request());
    expect(response.status).toBe(403);
    const responseBody = await response.text();
    expect(responseBody).not.toContain("private-test-secret");
    expect(responseBody).not.toContain("test-turnstile-token");
  });

  it.each(["invalid-input-response", "timeout-or-duplicate"])(
    "rejects invalid, expired or reused tokens (%s)",
    async (errorCode) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({ success: false, "error-codes": [errorCode] }),
        ),
      );
      const response = await call(request());
      expect(response.status).toBe(403);
      expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
      expect(await response.text()).not.toContain(errorCode);
    },
  );

  it("fails closed on malformed Siteverify JSON or network timeout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not-json", { status: 200 })),
    );
    expect((await call(request())).status).toBe(403);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timeout", "AbortError");
      }),
    );
    expect((await call(request())).status).toBe(403);
  });

  it("requires the expected action in the Siteverify response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "celenas-smp.pages.dev",
          action: "other_action",
        }),
      ),
    );
    expect((await call(request())).status).toBe(403);
  });

  it("rejects a non-Discord configured destination after successful verification", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "celenas-smp.pages.dev",
          action: "discord_join",
        }),
      ),
    );
    const response = await call(request(), {
      ...baseEnv,
      DISCORD_INVITE_URL: "https://attacker.invalid/",
    });
    expect(response.status).toBe(503);
  });
});
