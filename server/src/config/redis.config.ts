import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";

const options: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  maxRetriesPerRequest: null,
};

export const redis = new Redis(options);
