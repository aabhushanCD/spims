import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { AppError } from "../error.ts";

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

  console.error(err);

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
