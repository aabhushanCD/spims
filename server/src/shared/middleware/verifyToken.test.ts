import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";

vi.mock("../security/sessionRevocation.ts", () => ({
  isSessionAccessTokenRevoked: vi.fn(),
}));
vi.mock("../security/tokenVersion.ts", () => ({
  getCurrentTokenVersion: vi.fn(),
}));

import { verifyToken } from "./verifyToken.ts";
import { generateAccessToken } from "../../modules/auth/utils/authTokens.ts";
import { isSessionAccessTokenRevoked } from "../security/sessionRevocation.ts";
import { getCurrentTokenVersion } from "../security/tokenVersion.ts";

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
};

function createResponse() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  };
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

function createRequest(token: string): Request {
  return { cookies: { token } } as unknown as Request;
}

function token(ver?: number): string {
  return generateAccessToken({
    userId: "user-1",
    email: "asha@example.com",
    role: "pharmacist",
    sessionId: "session-1",
    ...(ver !== undefined ? { ver } : {}),
  });
}

async function run(tokenValue: string) {
  const req = createRequest(tokenValue);
  const res = createResponse();
  const next = vi.fn() as unknown as NextFunction;

  await verifyToken(req, res as unknown as Response, next);

  return { req, res, next };
}

describe("verifyToken", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "unit-access-secret";
    vi.mocked(isSessionAccessTokenRevoked).mockResolvedValue(false);
    vi.mocked(getCurrentTokenVersion).mockResolvedValue(0);
  });

  afterAll(() => {
    if (originalEnv.JWT_SECRET === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalEnv.JWT_SECRET;
    }
  });

  it("accepts a token whose session and version are current", async () => {
    const { req, next, res } = await run(token(0));

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(req.user).toMatchObject({
      userId: "user-1",
      sessionId: "session-1",
      ver: 0,
    });
  });

  it("rejects a token whose session is on the deny-list", async () => {
    vi.mocked(isSessionAccessTokenRevoked).mockResolvedValue(true);

    const { res, next } = await run(token(0));

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SESSION_REVOKED" }),
    );
  });

  it("rejects a token issued before the current token version", async () => {
    vi.mocked(getCurrentTokenVersion).mockResolvedValue(2);

    const { res, next } = await run(token(1));

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SESSION_REVOKED" }),
    );
  });

  it("rejects a versioned token when the user no longer exists", async () => {
    vi.mocked(getCurrentTokenVersion).mockResolvedValue(null);

    const { res, next } = await run(token(0));

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("allows a legacy token without a version claim to expire naturally", async () => {
    vi.mocked(getCurrentTokenVersion).mockResolvedValue(5);

    const { next, res } = await run(token());

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("fails open when the version store is unavailable", async () => {
    vi.mocked(getCurrentTokenVersion).mockRejectedValue(new Error("db down"));

    const { next, res } = await run(token(0));

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("rejects a missing or malformed token", async () => {
    const { res, next } = await run("not-a-jwt");

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
