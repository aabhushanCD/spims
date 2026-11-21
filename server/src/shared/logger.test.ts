import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "./logger.ts";

describe("structured logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it("writes one JSON line with redacted secrets", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    process.env.LOG_LEVEL = "info";

    logger.info("test_event", {
      userId: "user-1",
      password: "super-secret",
      authorization: "Bearer token",
    });

    expect(log).toHaveBeenCalledOnce();
    const entry = JSON.parse(String(log.mock.calls[0]?.[0])) as Record<
      string,
      unknown
    >;
    expect(entry).toMatchObject({
      level: "info",
      message: "test_event",
      userId: "user-1",
      password: "[redacted]",
      authorization: "[redacted]",
    });
    expect(entry.time).toBeTypeOf("string");
  });

  it("honours the configured level", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.LOG_LEVEL = "error";

    logger.info("suppressed");
    logger.error("shown");

    expect(log).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
  });
});
