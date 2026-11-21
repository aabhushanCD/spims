import type { RedisOptions } from "ioredis";

export interface RedisTarget {
  url?: string;
  options?: RedisOptions;
}

function asRedisUrlWithToken(rawUrl: string, token?: string): string {
  const parsed = new URL(rawUrl);
  const protocol = parsed.protocol === "https:" ? "rediss" : "redis";
  const auth = token ? `:${encodeURIComponent(token)}@` : "";
  return `${protocol}://${auth}${parsed.hostname}:6379`;
}

/**
 * Resolves the Redis connection without creating a client. Kept pure so the
 * URL/env edge cases can be tested without opening a connection.
 */
export function resolveRedisTarget(
  env: NodeJS.ProcessEnv = process.env,
): RedisTarget {
  const explicit = env.REDIS_URL?.trim();
  const legacy = env.UPSTASH_REDIS_REST_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim();

  for (const candidate of [explicit, legacy]) {
    if (!candidate) {
      continue;
    }
    if (/^rediss?:\/\//i.test(candidate)) {
      return { url: candidate };
    }
    if (/^https?:\/\//i.test(candidate)) {
      // Upstash's REST URL is not an ioredis target. Convert the host to the
      // TCP/TLS endpoint; the token becomes the password.
      return { url: asRedisUrlWithToken(candidate, token) };
    }
    throw new Error(
      "Redis URL must start with redis://, rediss://, http://, or https://",
    );
  }

  return {
    options: {
      host: env.REDIS_HOST?.trim() || "localhost",
      port: Number.parseInt(env.REDIS_PORT?.trim() || "6379", 10),
      password: env.REDIS_PASSWORD?.trim() || undefined,
      maxRetriesPerRequest: null,
      // ioredis 6 types require a concrete reply mapping under
      // exactOptionalPropertyTypes.
      replyMapping: "legacy",
    },
  };
}
