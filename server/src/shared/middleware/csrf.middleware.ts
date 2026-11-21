import crypto from "node:crypto";
import type { CookieOptions, NextFunction, Request, Response } from "express";

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * These endpoints establish or recover a session and already run the
 * origin check in the auth router. They must work before the client has a
 * CSRF cookie.
 */
const CSRF_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
]);

function csrfCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    // The SPA reads this cookie and mirrors it into the request header.
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function tokensMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

/**
 * Double-submit CSRF protection for cookie-authenticated routes.
 *
 * A random token is stored in a non-HttpOnly cookie and must be echoed in the
 * `X-CSRF-Token` header for unsafe methods. Cross-site attackers can cause the
 * browser to send the cookie, but cannot read it to forge the header.
 */
export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieToken: unknown = req.cookies?.csrfToken;

  if (typeof cookieToken !== "string" || cookieToken.length === 0) {
    // A response always carries a token so the next unsafe request can use it.
    res.cookie("csrfToken", generateToken(), csrfCookieOptions());
  }

  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const path = req.originalUrl.split("?")[0] ?? req.path;
  if (CSRF_EXEMPT_PATHS.has(path)) {
    next();
    return;
  }

  const headerToken = req.get(CSRF_HEADER_NAME);
  if (
    typeof cookieToken !== "string" ||
    !headerToken ||
    !tokensMatch(headerToken, cookieToken)
  ) {
    res.status(403).json({
      success: false,
      code: "CSRF_TOKEN_INVALID",
      message: "Invalid or missing CSRF token",
    });
    return;
  }

  next();
}
