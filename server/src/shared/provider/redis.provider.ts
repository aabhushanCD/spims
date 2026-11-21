import redis from "../../config/redis.config.ts";
import type { CacheInvalidator } from "./cacheInvalidator.ts";
import { DASHBOARD_CACHE_KEY, reorderCacheKey } from "./cacheKeys.ts";

export const getCache = async (key: string) => {
  const cache = await redis.get(key);
  if (!cache) {
    return null;
  }
  try {
    return JSON.parse(cache);
  } catch {
    // A corrupt value must not turn every read into a 500. Drop it and let the
    // caller recompute and replace it.
    await deleteCache(key);
    return null;
  }
};

export const setCache = async (key: string, value: unknown, ttl: number) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteCache = async (key: string) => {
  await redis.del(key);
};

export const redisCacheInvalidator: CacheInvalidator = {
  async invalidateDashboard(): Promise<void> {
    await deleteCache(DASHBOARD_CACHE_KEY);
  },

  async invalidateReorder(medicineId: string): Promise<void> {
    if (!medicineId) {
      return;
    }
    await deleteCache(reorderCacheKey(medicineId));
  },
};
