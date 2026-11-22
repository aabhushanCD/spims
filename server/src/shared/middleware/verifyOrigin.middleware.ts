import type { NextFunction, Request, Response } from "express";

import { isOriginAllowed } from "../utils/allowedOrigins.ts";

/**
 * Origin hardening for cookie-authenticated auth routes.
 *
 * Production rejects a missing Origin as well as a non-allow-listed one.
 * Development/test keeps the CLI/server-to-server exception.
 */
export function verifyOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (isOriginAllowed(req.headers.origin)) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    code: "ORIGIN_NOT_ALLOWED",
    message: "Request origin is not allowed",
  });
}
