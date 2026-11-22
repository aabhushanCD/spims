import { describe, expect, it, vi } from "vitest";

import {
  createLoginAttemptTracker,
  type LoginAttemptStore,
} from "./loginAttemptTracker.ts";

function createStore(): LoginAttemptStore & {
  values: Map<string, number>;
  expiries: Map<string, number>;
} {
  const values = new Map<string, number>();
  const expiries = new Map<string, number>();

  return {
    values,
    expiries,
    async incr(key: string): Promise<number> {
      const next = (values.get(key) ?? 0) + 1;
      values.set(key, next);
      return next;
    },
    async pexpire(_key: string, milliseconds: number): Promise<number> {
      expiries.set(_key, Date.now() + milliseconds);
      return 1;
    },
    async ttl(key: string): Promise<number> {
      const expiresAt = expiries.get(key);
      if (!expiresAt) {
        return values.has(key) ? -1 : -2;
      }
      return Math.max(0, Math.ceil((expiresAt - Date.now()) / 1_000));
    },
    async set(
      key: string,
      value: string,
      _mode: "PX",
      milliseconds: number,
    ): Promise<unknown> {
      values.set(key, Number(value));
      expiries.set(key, Date.now() + milliseconds);
      return "OK";
    },
    async del(...keys: string[]): Promise<number> {
      let removed = 0;
      for (const key of keys) {
        if (values.delete(key)) {
          removed += 1;
        }
        expiries.delete(key);
      }
      return removed;
    },
  };
}

describe("loginAttemptTracker", () => {
  it("locks only after the configured number of failures", async () => {
    const store = createStore();
    const tracker = createLoginAttemptTracker(store, {
      threshold: 3,
      windowMs: 60_000,
      durationMs: 120_000,
    });

    await expect(tracker.recordFailure("asha@example.com")).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
    await expect(tracker.recordFailure("asha@example.com")).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
    await expect(tracker.recordFailure("asha@example.com")).resolves.toEqual({
      locked: true,
      retryAfterSeconds: 120,
    });

    await expect(tracker.check("asha@example.com")).resolves.toMatchObject({
      locked: true,
    });
  });

  it("scopes counters to the normalized email", async () => {
    const store = createStore();
    const tracker = createLoginAttemptTracker(store, {
      threshold: 2,
      windowMs: 60_000,
      durationMs: 120_000,
    });

    await tracker.recordFailure("ASHA@example.com ");
    await tracker.recordFailure("asha@example.com");
    await expect(tracker.check("asha@example.com")).resolves.toMatchObject({
      locked: true,
    });
    await expect(tracker.check("other@example.com")).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
  });

  it("clears failures and the lock on a successful sign-in", async () => {
    const store = createStore();
    const tracker = createLoginAttemptTracker(store, {
      threshold: 1,
      windowMs: 60_000,
      durationMs: 120_000,
    });

    await tracker.recordFailure("asha@example.com");
    await expect(tracker.check("asha@example.com")).resolves.toMatchObject({
      locked: true,
    });

    await tracker.recordSuccess("asha@example.com");
    await expect(tracker.check("asha@example.com")).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
  });

  it("fails open when the store throws", async () => {
    const store: LoginAttemptStore = {
      incr: vi.fn().mockRejectedValue(new Error("redis down")),
      pexpire: vi.fn(),
      ttl: vi.fn().mockRejectedValue(new Error("redis down")),
      set: vi.fn(),
      del: vi.fn(),
    };
    const tracker = createLoginAttemptTracker(store, {
      threshold: 1,
      windowMs: 60_000,
      durationMs: 120_000,
    });

    await expect(tracker.check("asha@example.com")).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
    await expect(
      tracker.recordFailure("asha@example.com"),
    ).resolves.toEqual({
      locked: false,
      retryAfterSeconds: 0,
    });
  });
});
