import crypto from "node:crypto";
import redis from "../../config/redis.config.ts";

export interface LockProvider {
  acquire(key: string, ttlMs: number): Promise<string | null>;
  release(key: string, token: string): Promise<void>;
}

export interface RedisLockClient {
  set(
    key: string,
    value: string,
    mode: "PX",
    ttlMs: number,
    condition: "NX",
  ): Promise<"OK" | null>;
  eval(script: string, numberOfKeys: number, ...args: string[]): Promise<unknown>;
}

export function createRedisLockProvider(
  client: RedisLockClient,
): LockProvider {
  return {
    async acquire(key: string, ttlMs: number): Promise<string | null> {
      const token = crypto.randomUUID();
      const result = await client.set(key, token, "PX", ttlMs, "NX");
      return result === "OK" ? token : null;
    },

    async release(key: string, token: string): Promise<void> {
      await client.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        1,
        key,
        token,
      );
    },
  };
}

export const redisLockProvider = createRedisLockProvider(
  redis as unknown as RedisLockClient,
);

export async function runWithLock(
  lock: LockProvider,
  key: string,
  ttlMs: number,
  fn: () => Promise<void>,
): Promise<boolean> {
  const token = await lock.acquire(key, ttlMs);
  if (!token) {
    return false;
  }
  try {
    await fn();
    return true;
  } finally {
    await lock.release(key, token);
  }
}
