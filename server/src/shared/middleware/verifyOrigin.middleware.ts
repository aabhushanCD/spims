import type { NextFunction, Request, Response } from "express";

import { isOriginAllowed } from "../utils/allowedOrigins.ts";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Origin hardening for cookie-authenticated auth routes.
 *
 * Safe methods are exempt: same-origin `GET`/`HEAD`/`OPTIONS` requests do not
 * carry an `Origin` header, and CSRF does not apply to read-only methods.
 * Cross-origin reads are governed by CORS. State-changing requests always
 * carry an `Origin` from browsers, and production rejects a missing or
 * non-allow-listed origin.
 */
export function verifyOrigin(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

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
