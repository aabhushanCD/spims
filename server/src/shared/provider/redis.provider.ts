import redis from "../../config/redis.config.ts";

export const getCache = async (key: string) => {
  const cache = await redis.get(key);
  return cache ? JSON.parse(cache) : null;
};

export const setCache = async (key: string, value: any, ttl: number) => {
  await redis.set(key, JSON.stringify(value), "EX", ttl);
};

export const deleteCache = async (key: string) => {
  await redis.del(key);
};
