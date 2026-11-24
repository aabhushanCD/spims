import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";

import { csrfProtection } from "./csrf.middleware.ts";

const originalNodeEnv = process.env.NODE_ENV;

afterEach(() => {
  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

function buildRequest(options: {
  method?: string;
  url?: string;
  cookieToken?: string;
  headerToken?: string;
}): Request {
  const { method = "POST", url = "/api/sales" } = options;
  return {
    method,
    originalUrl: url,
    path: url,
    cookies: options.cookieToken
      ? { csrfToken: options.cookieToken }
      : {},
    get: (name: string) =>
      name.toLowerCase() === "x-csrf-token"
        ? options.headerToken
        : undefined,
  } as unknown as Request;
}

function buildResponse(): Response {
  return {
    cookie: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;
}

describe("csrfProtection", () => {
  it("issues a token for safe requests", () => {
    const req = buildRequest({ method: "GET" });
    const res = buildResponse();
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "csrfToken",
      expect.any(String),
      expect.objectContaining({ httpOnly: false, path: "/" }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses production cookie flags for the issued token", () => {
    process.env.NODE_ENV = "production";
    const req = buildRequest({ method: "GET" });
    const res = buildResponse();
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "csrfToken",
      expect.any(String),
      expect.objectContaining({ secure: true, sameSite: "none" }),
    );
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects an unsafe request without a token", () => {
    const req = buildRequest({ method: "POST" });
    const res = buildResponse();
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "CSRF_TOKEN_INVALID" }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a mismatched header token", () => {
    const req = buildRequest({
      method: "PATCH",
      cookieToken: "cookie-token",
      headerToken: "header-token",
    });
    const res = buildResponse();
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts an unsafe request with a matching token", () => {
    const req = buildRequest({
      method: "DELETE",
      cookieToken: "matching-token",
      headerToken: "matching-token",
    });
    const res = buildResponse();
    const next = vi.fn() as NextFunction;

    csrfProtection(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});
