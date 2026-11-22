import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { AppError } from "../error.ts";
import { logger } from "../logger.ts";

function isCastError(
  error: unknown,
): error is Error & { name: "CastError"; path?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "CastError"
  );
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    if (err.headers) {
      for (const [name, value] of Object.entries(err.headers)) {
        res.setHeader(name, value);
      }
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  if (isCastError(err)) {
    const field = err.path || "identifier";
    return res.status(400).json({
      success: false,
      message: `Invalid ${field}`,
    });
  }

  logger.error("unhandled_error", {
    method: req.method,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
