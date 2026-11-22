import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  getAllowedOrigins,
  isOriginAllowed,
} from "./allowedOrigins.ts";

const originalEnv = {
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  NODE_ENV: process.env.NODE_ENV,
};

describe("allowed origins", () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = JSON.stringify([
      "https://spims.example.com",
    ]);
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it("parses the configured allow-list", () => {
    expect(getAllowedOrigins()).toEqual(["https://spims.example.com"]);
  });

  it("falls back to development origins for invalid JSON", () => {
    process.env.ALLOWED_ORIGINS = "not-json";
    expect(getAllowedOrigins()).toEqual([
      "http://localhost:5173",
      "http://localhost:5174",
    ]);
  });

  it("allows an exact origin and rejects a different one", () => {
    expect(
      isOriginAllowed("https://spims.example.com", [
        "https://spims.example.com",
      ]),
    ).toBe(true);
    expect(
      isOriginAllowed("https://evil.example.com", [
        "https://spims.example.com",
      ]),
    ).toBe(false);
  });

  it("requires an Origin header in production", () => {
    process.env.NODE_ENV = "production";
    expect(isOriginAllowed(undefined, ["https://spims.example.com"])).toBe(
      false,
    );
    process.env.NODE_ENV = "development";
    expect(isOriginAllowed(undefined, ["https://spims.example.com"])).toBe(
      true,
    );
  });
});
