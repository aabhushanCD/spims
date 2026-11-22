import redis from "../../config/redis.config.ts";
import { User } from "../../modules/user/model/user.model.ts";
import { logger } from "../logger.ts";
import type { TokenVersionMaintenance } from "./security.types.ts";

const VERSION_CACHE_TTL_SECONDS = 60;

function versionKey(userId: string): string {
  return `auth:token-version:${userId}`;
}

export async function invalidateTokenVersion(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  try {
    await redis.del(versionKey(userId));
  } catch (error) {
    logger.warn("token_version_cache_invalidate_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Returns the current token version, or null when the user no longer exists.
 * Callers must reject null rather than treating it as version 0 so a deleted
 * account cannot keep using a previously issued access token.
 */
export async function getCurrentTokenVersion(
  userId: string,
): Promise<number | null> {
  try {
    const cached = await redis.get(versionKey(userId));
    if (cached !== null) {
      const parsed = Number(cached);
      return Number.isFinite(parsed) ? parsed : null;
    }
  } catch (error) {
    logger.warn("token_version_cache_read_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const user = await User.findById(userId)
    .select("tokenVersion")
    .lean<{ tokenVersion?: number } | null>()
    .exec();

  if (!user) {
    return null;
  }

  const version = user.tokenVersion ?? 0;

  try {
    await redis.set(
      versionKey(userId),
      String(version),
      "EX",
      VERSION_CACHE_TTL_SECONDS,
    );
  } catch (error) {
    logger.warn("token_version_cache_write_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return version;
}

export const redisTokenVersionMaintenance: TokenVersionMaintenance = {
  invalidate: invalidateTokenVersion,
};
