interface DurableStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  deleteAll(): Promise<void>;
  transaction<T>(callback: (storage: DurableStorage) => Promise<T>): Promise<T>;
  setAlarm(scheduledTime: number): Promise<void>;
}

interface DurableObjectState {
  storage: DurableStorage;
}

const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 2;
const SUSTAINED_WINDOW_MS = 60_000;
const SUSTAINED_MAX = 5;

export class JoinRateLimiter {
  private readonly storage: DurableStorage;
  private queue = Promise.resolve();

  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }

  async serialize<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  fetch(request: Request): Promise<Response> {
    return this.serialize(() => this.handleFetch(request));
  }

  private async handleFetch(request: Request): Promise<Response> {
    if (
      request.method !== "POST" ||
      new URL(request.url).pathname !== "/check"
    ) {
      return new Response(null, { status: 404 });
    }
    try {
      const body: unknown = await request.json();
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 0
      )
        return new Response(null, { status: 400 });
    } catch {
      return new Response(null, { status: 400 });
    }
    const now = Date.now();

    try {
      const result = await this.storage.transaction(async (storage) => {
        const stored = (await storage.get<number[]>("events")) ?? [];
        const events = stored.filter(
          (timestamp) => now - timestamp < SUSTAINED_WINDOW_MS,
        );
        const burst = events.filter(
          (timestamp) => now - timestamp < BURST_WINDOW_MS,
        );
        const retryAfterMs = Math.max(
          burst.length >= BURST_MAX ? burst[0]! + BURST_WINDOW_MS - now : 0,
          events.length >= SUSTAINED_MAX
            ? events[0]! + SUSTAINED_WINDOW_MS - now
            : 0,
        );
        if (retryAfterMs > 0)
          return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
        events.push(now);
        await storage.put("events", events);
        return { allowed: true, retryAfter: 0 };
      });
      if (result.allowed)
        await this.storage.setAlarm(now + SUSTAINED_WINDOW_MS);
      return Response.json(result, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch {
      return new Response(null, { status: 503 });
    }
  }

  alarm(): Promise<void> {
    return this.serialize(() => this.handleAlarm());
  }

  private async handleAlarm(): Promise<void> {
    const now = Date.now();
    const nextExpiry = await this.storage.transaction(async (storage) => {
      const stored = (await storage.get<number[]>("events")) ?? [];
      const events = stored.filter(
        (timestamp) => now - timestamp < SUSTAINED_WINDOW_MS,
      );
      if (events.length === 0) return null;
      await storage.put("events", events);
      return events[events.length - 1]! + SUSTAINED_WINDOW_MS;
    });
    if (nextExpiry === null) {
      await this.storage.deleteAll();
      return;
    }
    await this.storage.setAlarm(nextExpiry);
  }
}

const worker = {
  fetch(): Response {
    return new Response(null, { status: 404 });
  },
};

export default worker;
