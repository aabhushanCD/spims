import crypto from "node:crypto";

import redis from "../../config/redis.config.ts";
import { logger } from "../logger.ts";
import {
  getLockoutDurationMs,
  getLockoutThreshold,
  getLockoutWindowMs,
} from "../../modules/auth/utils/authConfig.ts";
import type {
  LockoutState,
  LoginAttemptTracker,
} from "./security.types.ts";

export interface LoginAttemptStore {
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  set(
    key: string,
    value: string,
    mode: "PX",
    milliseconds: number,
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
}

export interface LoginAttemptOptions {
  threshold: number;
  windowMs: number;
  durationMs: number;
}

const UNLOCKED: LockoutState = { locked: false, retryAfterSeconds: 0 };

function emailKey(email: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return hash;
}

export function createLoginAttemptTracker(
  store: LoginAttemptStore = redis as unknown as LoginAttemptStore,
  options: LoginAttemptOptions = {
    threshold: getLockoutThreshold(),
    windowMs: getLockoutWindowMs(),
    durationMs: getLockoutDurationMs(),
  },
): LoginAttemptTracker {
  const failureKey = (email: string) =>
    `auth:login-failure:${emailKey(email)}`;
  const lockKey = (email: string) => `auth:login-lock:${emailKey(email)}`;

  return {
    async check(email: string): Promise<LockoutState> {
      try {
        const ttl = await store.ttl(lockKey(email));
        if (ttl > 0) {
          return { locked: true, retryAfterSeconds: ttl };
        }
        return UNLOCKED;
      } catch (error) {
        // Availability over strict enforcement: a Redis outage must not make
        // every sign-in fail. The existing in-process/IP rate limit still
        // applies while the store is unavailable.
        logger.warn("login_lockout_check_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        return UNLOCKED;
      }
    },

    async recordFailure(email: string): Promise<LockoutState> {
      try {
        const key = failureKey(email);
        const count = await store.incr(key);
        if (count === 1) {
          await store.pexpire(key, options.windowMs);
        }

        if (count < options.threshold) {
          return UNLOCKED;
        }

        await store.set(lockKey(email), "1", "PX", options.durationMs);
        await store.del(key);
        return {
          locked: true,
          retryAfterSeconds: Math.ceil(options.durationMs / 1_000),
        };
      } catch (error) {
        logger.warn("login_lockout_record_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        return UNLOCKED;
      }
    },

    async recordSuccess(email: string): Promise<void> {
      try {
        await store.del(failureKey(email), lockKey(email));
      } catch (error) {
        logger.warn("login_lockout_clear_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

export const redisLoginAttemptTracker = createLoginAttemptTracker();
