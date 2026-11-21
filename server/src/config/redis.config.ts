import "./env.ts";
import { Redis } from "ioredis";
import { logger } from "../shared/logger.ts";
import { resolveRedisTarget } from "./redis.target.ts";

export { resolveRedisTarget } from "./redis.target.ts";
export type { RedisTarget } from "./redis.target.ts";

const target = resolveRedisTarget();

const redis = target.url
  ? new Redis(target.url, { replyMapping: "legacy" })
  : new Redis({ ...target.options, replyMapping: "legacy" });

redis.on("error", (err) => {
  logger.error("redis_connection_error", {
    error: err instanceof Error ? err.message : String(err),
  });
});
redis.on("connect", () => {
  logger.info("redis_connected");
});

export default redis;
