import type { NextFunction, Request, Response } from "express";

function getAllowedOrigins(): string[] {
  try {
    const parsed: unknown = process.env.ALLOWED_ORIGINS
      ? JSON.parse(process.env.ALLOWED_ORIGINS)
      : ["http://localhost:5173", "http://localhost:5174"];

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (origin): origin is string => typeof origin === "string",
      );
    }
  } catch {
    // Fall back to the development origins below.
  }

  return ["http://localhost:5173", "http://localhost:5174"];
}

/**
 * Lightweight CSRF hardening for cookie-authenticated auth routes.
 *
 * Requests without an Origin header (curl, server-to-server, some mobile
 * clients) are allowed. Browser requests must come from an allowed origin.
 * In production the refresh cookie uses SameSite=None, so this check matters.
 */
export function verifyOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;

  if (!origin) {
    next();
    return;
  }

  if (getAllowedOrigins().includes(origin)) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    code: "ORIGIN_NOT_ALLOWED",
    message: "Request origin is not allowed",
  });
}
