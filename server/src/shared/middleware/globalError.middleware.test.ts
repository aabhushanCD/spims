import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

import { errorHandler } from "./globalError.middleware.ts";
import { AppError } from "../error.ts";

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

function runHandler(error: Error) {
  const res = createResponse();

  errorHandler(
    error,
    {} as Request,
    res as unknown as Response,
    vi.fn() as unknown as NextFunction,
  );

  return res;
}

describe("global error handler", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps operational AppError responses", () => {
    const res = runHandler(AppError.forbidden("Only owners can manage users"));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Only owners can manage users",
    });
  });

  it("maps a Mongoose CastError to a 400", () => {
    const error = Object.assign(new Error("Cast to ObjectId failed"), {
      name: "CastError",
      path: "_id",
    });

    const res = runHandler(error);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Invalid _id",
    });
  });

  it("does not leak internal errors", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const res = runHandler(new Error("database exploded"));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal Server Error",
    });
  });
});
