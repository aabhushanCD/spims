import { describe, expect, it } from "vitest";
import { resolveRedisTarget } from "./redis.target.ts";

describe("resolveRedisTarget", () => {
  it("uses an explicit redis:// URL", () => {
    expect(
      resolveRedisTarget({
        REDIS_URL: "redis://localhost:6379",
        UPSTASH_REDIS_REST_URL: "https://ignored.example",
      } as NodeJS.ProcessEnv),
    ).toEqual({ url: "redis://localhost:6379" });
  });

  it("converts an Upstash REST URL to a TLS TCP URL with the token", () => {
    expect(
      resolveRedisTarget({
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
        UPSTASH_REDIS_REST_TOKEN: "secret",
      } as NodeJS.ProcessEnv),
    ).toEqual({ url: "rediss://:secret@example.upstash.io:6379" });
  });

  it("falls back to host/port options when no URL is configured", () => {
    const target = resolveRedisTarget({} as NodeJS.ProcessEnv);
    expect(target.url).toBeUndefined();
    expect(target.options).toMatchObject({
      host: "localhost",
      port: 6379,
      replyMapping: "legacy",
    });
  });

  it("rejects an unsupported URL scheme", () => {
    expect(() =>
      resolveRedisTarget({
        REDIS_URL: "ftp://example.com",
      } as NodeJS.ProcessEnv),
    ).toThrowError("Redis URL must start with");
  });
});
