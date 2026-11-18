import { describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { authorize } from "./authorize.ts";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

function runMiddleware(role?: string) {
  const req = { user: role ? { role } : undefined } as unknown as Request;
  const res = createResponse();
  const next = vi.fn() as unknown as NextFunction;

  authorize(["owner", "inventory_manager"])(req, res as unknown as Response, next);

  return { res, next };
}

describe("authorize middleware", () => {
  it("allows a permitted role", () => {
    const { res, next } = runMiddleware("owner");

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a role that is not permitted", () => {
    const { res, next } = runMiddleware("pharmacist");

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
  });

  it("rejects unauthenticated requests", () => {
    const { res, next } = runMiddleware();

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("rejects every role when the permission list is empty", () => {
    const req = { user: { role: "owner" } } as unknown as Request;
    const res = createResponse();
    const next = vi.fn() as unknown as NextFunction;

    authorize([])(req, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
