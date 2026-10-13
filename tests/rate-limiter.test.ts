import { describe, expect, it, vi } from "vitest";
import { JoinRateLimiter } from "../cloudflare/rate-limiter/src/index";

class MemoryStorage {
  values = new Map<string, unknown>();
  alarmAt = 0;
  private pending = Promise.resolve();
  async get<T>(key: string) {
    return this.values.get(key) as T | undefined;
  }
  async put<T>(key: string, value: T) {
    this.values.set(key, value);
  }
  async deleteAll() {
    this.values.clear();
  }
  async setAlarm(time: number) {
    this.alarmAt = time;
  }
  async transaction<T>(callback: (storage: MemoryStorage) => Promise<T>) {
    const previous = this.pending;
    let release!: () => void;
    this.pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await callback(this);
    } finally {
      release();
    }
  }
}

function post(body = "{}") {
  return new Request("https://internal/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("Durable Object join limiter", () => {
  it("enforces a short burst limit and a sustained per-sender limit", async () => {
    const storage = new MemoryStorage();
    const actor = new JoinRateLimiter({
      storage: storage as unknown as ConstructorParameters<
        typeof JoinRateLimiter
      >[0]["storage"],
    });
    vi.useFakeTimers();
    const start = Date.now();
    expect(await (await actor.fetch(post())).json()).toMatchObject({
      allowed: true,
    });
    vi.setSystemTime(start + 100);
    expect(await (await actor.fetch(post())).json()).toMatchObject({
      allowed: true,
    });
    vi.setSystemTime(start + 200);
    const burst = await actor.fetch(post());
    expect(burst.status).toBe(200);
    expect(await burst.json()).toMatchObject({
      allowed: false,
      retryAfter: 10,
    });
    for (const offset of [10_100, 20_100, 30_100]) {
      vi.setSystemTime(start + offset);
      expect(await (await actor.fetch(post())).json()).toMatchObject({
        allowed: true,
      });
    }
    vi.setSystemTime(start + 40_100);
    const sustained = await actor.fetch(post());
    expect(await sustained.json()).toMatchObject({
      allowed: false,
      retryAfter: 20,
    });
    expect(storage.alarmAt).toBe(start + 90_100);
    vi.useRealTimers();
  });

  it("rejects malformed internal requests and clears sender state after expiry", async () => {
    const storage = new MemoryStorage();
    const actor = new JoinRateLimiter({
      storage: storage as unknown as ConstructorParameters<
        typeof JoinRateLimiter
      >[0]["storage"],
    });
    expect(
      (
        await actor.fetch(
          new Request("https://internal/check", { method: "GET" }),
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await actor.fetch(
          new Request("https://internal/check", {
            method: "POST",
            body: '{"now":123}',
          }),
        )
      ).status,
    ).toBe(400);
    vi.useFakeTimers();
    const now = Date.now();
    await actor.fetch(post());
    expect(storage.values.size).toBeGreaterThan(0);
    vi.setSystemTime(now + 60_001);
    await actor.alarm();
    expect(storage.values.size).toBe(0);
    vi.useRealTimers();
  });

  it("keeps concurrent submissions atomic for one source", async () => {
    const storage = new MemoryStorage();
    const actor = new JoinRateLimiter({
      storage: storage as unknown as ConstructorParameters<
        typeof JoinRateLimiter
      >[0]["storage"],
    });
    const responses = await Promise.all([
      actor.fetch(post()),
      actor.fetch(post()),
      actor.fetch(post()),
    ]);
    const results = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(results.filter((result) => result.allowed)).toHaveLength(2);
    expect(results.filter((result) => !result.allowed)).toHaveLength(1);
  });
});
