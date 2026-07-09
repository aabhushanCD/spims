import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";

const options: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

const redis = new Redis(options);

redis.on("error", (err) => console.error("[Redis] Connection error:", err));
redis.on("connect", () => console.log("[Redis] Connected"));

export default redis;
