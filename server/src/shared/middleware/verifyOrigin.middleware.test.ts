import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

import { verifyOrigin } from "./verifyOrigin.middleware.ts";

const originalEnv = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  NODE_ENV: process.env.NODE_ENV,
};

function run(origin?: string) {
  const req = { headers: { origin } } as unknown as Request;
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  const next = vi.fn() as unknown as NextFunction;

  verifyOrigin(req, res as unknown as Response, next);

  return { next, res };
}

describe("verifyOrigin", () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = JSON.stringify([
      "https://spims.example.com",
    ]);
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("allows an allow-listed origin", () => {
    const { next, res } = run("https://spims.example.com");
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a non-allow-listed origin", () => {
    const { next, res } = run("https://evil.example.com");
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("allows missing Origin outside production", () => {
    const { next } = run();
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects missing Origin in production", () => {
    process.env.NODE_ENV = "production";
    const { next, res } = run();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
