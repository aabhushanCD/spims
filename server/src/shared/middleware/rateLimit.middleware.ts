import type { NextFunction, Request, Response } from "express";

import redis from "../../config/redis.config.ts";
import { getClientIp } from "../utils/requestContext.ts";

export interface RateLimitStore {
  incr(key: string): Promise<number>;
  pexpire(key: string, milliseconds: number): Promise<number>;
}

export interface RateLimitOptions {
  prefix: string;
  windowMs: number;
  max: number;
  message?: string;
  store?: RateLimitStore;
  keyGenerator?: (req: Request) => string;
}

function getBodyEmail(req: Request): string | undefined {
  const body: unknown = req.body;

  if (!body || typeof body !== "object" || !("email" in body)) {
    return undefined;
  }

  const email = (body as Record<string, unknown>).email;
  return typeof email === "string" && email.length > 0
    ? email.trim().toLowerCase()
    : undefined;
}

/**
 * Rate-limit login attempts per client IP and account email. This keeps a
 * shared pharmacy NAT from locking out every user after one person mistypes
 * their password, while still limiting attacks against a specific account.
 */
export function ipAndEmailKey(req: Request): string {
  const email = getBodyEmail(req);
  return email ? `${getClientIp(req)}:${email}` : getClientIp(req);
}

export function createRateLimiter(options: RateLimitOptions) {
  const store = options.store ?? redis;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identity = options.keyGenerator
      ? options.keyGenerator(req)
      : getClientIp(req);
    const key = `rate-limit:${options.prefix}:${identity}`;

    try {
      const count = await store.incr(key);

      if (count === 1) {
        await store.pexpire(key, options.windowMs);
      }

      if (count > options.max) {
        const retryAfterSeconds = Math.ceil(options.windowMs / 1_000);
        res.setHeader("Retry-After", String(retryAfterSeconds));
        res.status(429).json({
          success: false,
          code: "RATE_LIMITED",
          message:
            options.message ??
            "Too many requests. Please try again later.",
        });
        return;
      }

      next();
    } catch (error) {
      // Authentication should remain available if Redis is temporarily
      // unavailable. The failure is logged rather than turning every login
      // into a 500.
      console.error("[RateLimit] Store error", error);
      next();
    }
  };
}
