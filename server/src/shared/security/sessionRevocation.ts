import redis from "../../config/redis.config.ts";
import { getAccessTokenTtlMs } from "../../modules/auth/utils/authConfig.ts";
import { logger } from "../logger.ts";
import type { SessionRevocation } from "./security.types.ts";

function revokedSessionKey(sessionId: string): string {
  return `auth:revoked-session:${sessionId}`;
}

export async function revokeSessionAccessToken(
  sessionId: string,
): Promise<void> {
  if (!sessionId) {
    return;
  }

  try {
    await redis.set(
      revokedSessionKey(sessionId),
      "1",
      "PX",
      getAccessTokenTtlMs(),
    );
  } catch (error) {
    logger.warn("session_revocation_write_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function isSessionAccessTokenRevoked(
  sessionId: string,
): Promise<boolean> {
  if (!sessionId) {
    return false;
  }

  try {
    return (await redis.exists(revokedSessionKey(sessionId))) > 0;
  } catch (error) {
    // Fail open for availability. Access tokens still expire within the
    // configured access-token lifetime, and the refresh session is revoked in
    // MongoDB independently of this deny-list.
    logger.warn("session_revocation_check_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export const redisSessionRevocation: SessionRevocation = {
  revokeSessionAccessToken,
};
