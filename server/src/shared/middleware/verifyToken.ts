import type { NextFunction, Request, Response } from "express";

import type { JWTUserPayload } from "../../types/global.ts";
import { verifyJwt } from "./verifyJwt.ts";
import { logger } from "../logger.ts";
import { isSessionAccessTokenRevoked } from "../security/sessionRevocation.ts";
import { getCurrentTokenVersion } from "../security/tokenVersion.ts";

function unauthorized(res: Response, message: string, code?: string) {
  return res.status(401).json({
    message,
    ...(code ? { code } : {}),
  });
}

/**
 * Verifies the access token and, for tokens that carry a session/version
 * claim, checks the Redis deny-list and the user's current token version.
 *
 * Fail-open on cache/database errors: the token still has a short TTL, and a
 * transient outage must not take the whole API down. The failure is logged so
 * it is visible in operations.
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let payload: JWTUserPayload;

  try {
    const token = req.cookies.token;
    payload = verifyJwt(token);
  } catch (error) {
    logger.warn("jwt_verification_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return unauthorized(res, "Unauthorized: Invalid token");
  }

  try {
    if (
      payload.sessionId &&
      (await isSessionAccessTokenRevoked(payload.sessionId))
    ) {
      return unauthorized(
        res,
        "Your session has been revoked. Please sign in again.",
        "SESSION_REVOKED",
      );
    }
  } catch (error) {
    logger.warn("session_revocation_check_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Legacy tokens issued before tokenVersion existed have no `ver`. They are
  // allowed to expire naturally; every newly issued token is version-checked.
  if (typeof payload.ver === "number") {
    try {
      const currentVersion = await getCurrentTokenVersion(payload.userId);
      if (currentVersion === null || currentVersion !== payload.ver) {
        return unauthorized(
          res,
          "Your session is no longer valid. Please sign in again.",
          "SESSION_REVOKED",
        );
      }
    } catch (error) {
      logger.warn("token_version_check_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  req.user = payload;
  return next();
};
