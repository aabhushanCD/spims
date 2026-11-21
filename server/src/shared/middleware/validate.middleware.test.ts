import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import {
  validate,
  validateParams,
  validateQuery,
} from "./validate.middleware.ts";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

function runMiddleware(
  middleware: ReturnType<typeof validate>,
  req: Request,
) {
  const res = createResponse();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res as unknown as Response, next);

  return { res, next };
}

describe("validate middleware", () => {
  it("replaces the body with parsed data", () => {
    const schema = z.object({ name: z.string().trim() });
    const req = { body: { name: "  Asha  " } } as unknown as Request;

    const { res, next } = runMiddleware(validate(schema), req);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.body).toEqual({ name: "Asha" });
  });

  it("returns the existing 400 shape for an invalid body", () => {
    const schema = z.object({ name: z.string().min(1) });
    const req = { body: { name: "" } } as unknown as Request;

    const { res, next } = runMiddleware(validate(schema), req);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      errors: { name: expect.any(Array) },
    });
  });

  it("replaces route params with parsed data", () => {
    const schema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
    } as unknown as Request;

    const { res, next } = runMiddleware(validateParams(schema), req);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.params).toEqual({ id: "507f1f77bcf86cd799439011" });
  });

  it("rejects invalid route params", () => {
    const schema = z.object({ id: z.string().regex(/^[a-f0-9]{24}$/) });
    const req = { params: { id: "not-an-id" } } as unknown as Request;

    const { res, next } = runMiddleware(validateParams(schema), req);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("replaces query data even when the request exposes a getter", () => {
    const schema = z.object({ query: z.string().trim() });
    const prototype = {
      get query() {
        return { query: " stale " };
      },
    };
    const req = Object.create(prototype) as Request;

    const { res, next } = runMiddleware(validateQuery(schema), req);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.query).toEqual({ query: "stale" });
    expect(Object.getOwnPropertyDescriptor(req, "query")?.writable).toBe(true);
  });

  it("rejects invalid query data", () => {
    const schema = z.object({ limit: z.coerce.number().int().positive() });
    const req = { query: { limit: "zero" } } as unknown as Request;

    const { res, next } = runMiddleware(validateQuery(schema), req);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
