import { describe, expect, it, vi } from "vitest";
import {
  createRedisLockProvider,
  runWithLock,
  type LockProvider,
  type RedisLockClient,
} from "./lock.provider.ts";

describe("distributed lock", () => {
  it("returns a token only when SET NX succeeds", async () => {
    const client: RedisLockClient = {
      set: vi.fn().mockResolvedValueOnce("OK").mockResolvedValueOnce(null),
      eval: vi.fn().mockResolvedValue(1),
    };
    const lock = createRedisLockProvider(client);

    await expect(lock.acquire("lock:test", 1000)).resolves.toEqual(
      expect.any(String),
    );
    await expect(lock.acquire("lock:test", 1000)).resolves.toBeNull();
  });

  it("releases with a compare-and-delete script", async () => {
    const evalMock = vi.fn().mockResolvedValue(1);
    const lock = createRedisLockProvider({
      set: vi.fn().mockResolvedValue("OK"),
      eval: evalMock,
    });

    await lock.release("lock:test", "token-1");

    expect(evalMock).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('get'"),
      1,
      "lock:test",
      "token-1",
    );
  });

  it("skips the callback when the lock is already held", async () => {
    const lock: LockProvider = {
      acquire: vi.fn().mockResolvedValue(null),
      release: vi.fn(),
    };
    const callback = vi.fn();

    await expect(
      runWithLock(lock, "lock:test", 1000, callback),
    ).resolves.toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it("runs and releases the callback when the lock is acquired", async () => {
    const release = vi.fn();
    const lock: LockProvider = {
      acquire: vi.fn().mockResolvedValue("token-1"),
      release,
    };
    const callback = vi.fn().mockResolvedValue(undefined);

    await expect(
      runWithLock(lock, "lock:test", 1000, callback),
    ).resolves.toBe(true);
    expect(callback).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledWith("lock:test", "token-1");
  });
});
