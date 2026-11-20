import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

import { createRateLimiter } from "./rateLimit.middleware.ts";

function buildRequest(): Request {
  return {
    headers: { "x-forwarded-for": "203.0.113.10" },
    ip: "203.0.113.10",
  } as unknown as Request;
}

function buildResponse() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const setHeader = vi.fn();
  const response = { status, setHeader } as unknown as Response;

  return { response, status, setHeader, json };
}

describe("createRateLimiter", () => {
  it("allows requests under the limit and sets the window on first use", async () => {
    const store = {
      incr: vi.fn().mockResolvedValue(1),
      pexpire: vi.fn().mockResolvedValue(1),
    };
    const limiter = createRateLimiter({
      prefix: "test",
      windowMs: 60_000,
      max: 5,
      store,
    });
    const next = vi.fn() as NextFunction;
    const { response } = buildResponse();

    await limiter(buildRequest(), response, next);

    expect(store.incr).toHaveBeenCalledWith(
      "rate-limit:test:203.0.113.10",
    );
    expect(store.pexpire).toHaveBeenCalledWith(
      "rate-limit:test:203.0.113.10",
      60_000,
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 429 with Retry-After when the limit is exceeded", async () => {
    const store = {
      incr: vi.fn().mockResolvedValue(6),
      pexpire: vi.fn().mockResolvedValue(1),
    };
    const limiter = createRateLimiter({
      prefix: "test",
      windowMs: 60_000,
      max: 5,
      message: "Slow down",
      store,
    });
    const next = vi.fn() as NextFunction;
    const { response, status, setHeader, json } = buildResponse();

    await limiter(buildRequest(), response, next);

    expect(setHeader).toHaveBeenCalledWith("Retry-After", "60");
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      success: false,
      code: "RATE_LIMITED",
      message: "Slow down",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("fails open when the store is unavailable", async () => {
    const store = {
      incr: vi.fn().mockRejectedValue(new Error("Redis down")),
      pexpire: vi.fn(),
    };
    const limiter = createRateLimiter({
      prefix: "test",
      windowMs: 60_000,
      max: 5,
      store,
    });
    const next = vi.fn() as NextFunction;
    const { response } = buildResponse();

    await limiter(buildRequest(), response, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
