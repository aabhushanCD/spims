import { afterAll, beforeEach, describe, expect, it } from "vitest";

import {
  compareTokenHash,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./authTokens.ts";

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
};

describe("authTokens", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-access-secret";
    process.env.JWT_REFRESH_SECRET = "unit-refresh-secret";
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

  it("signs and verifies an access token", () => {
    const token = generateAccessToken({
      userId: "user-1",
      email: "asha@example.com",
      role: "pharmacist",
      sessionId: "session-1",
    });

    expect(verifyAccessToken(token)).toMatchObject({
      userId: "user-1",
      email: "asha@example.com",
      role: "pharmacist",
      sessionId: "session-1",
      type: "access",
    });
  });

  it("signs and verifies a refresh token", () => {
    const token = generateRefreshToken({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(verifyRefreshToken(token)).toMatchObject({
      userId: "user-1",
      sessionId: "session-1",
      type: "refresh",
    });
  });

  it("rejects a refresh token used as an access token", () => {
    const token = generateRefreshToken({
      userId: "user-1",
      sessionId: "session-1",
    });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("rejects an access token used as a refresh token", () => {
    const token = generateAccessToken({
      userId: "user-1",
      email: "asha@example.com",
      role: "pharmacist",
      sessionId: "session-1",
    });

    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it("hashes tokens deterministically and compares in constant time", () => {
    const token = "a-very-secret-token";
    const hash = hashToken(token);

    expect(hash).toHaveLength(64);
    expect(compareTokenHash(token, hash)).toBe(true);
    expect(compareTokenHash("a-different-token", hash)).toBe(false);
    expect(compareTokenHash(token, "short")).toBe(false);
  });
});
