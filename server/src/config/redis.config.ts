import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";

const options: RedisOptions = {
  host:
    process.env.UPSTASH_REDIS_REST_URL?.split("://")[1]
      ?.split("@")[1]
      ?.split(":")[0] || "localhost",
  port: parseInt(
    process.env.UPSTASH_REDIS_REST_URL?.split("://")[1]
      ?.split("@")[1]
      ?.split(":")[1] || "6379",
    10,
  ),
  password: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
  maxRetriesPerRequest: null,
};

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redis = redisUrl ? new Redis(redisUrl) : new Redis(options);

redis.on("error", (err) => console.error("[Redis] Connection error:", err));
redis.on("connect", () => console.log("[Redis] Connected"));

export default redis;
