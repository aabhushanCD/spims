import crypto from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";

import {
  getAccessTokenTtlMs,
  getJwtSecret,
  getRefreshSecret,
  getRefreshTokenTtlMs,
} from "./authConfig.ts";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  userId: string;
  sessionId: string;
  type: "refresh";
}

export interface AccessTokenInput {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface RefreshTokenInput {
  userId: string;
  sessionId: string;
}

function toSeconds(milliseconds: number): number {
  return Math.max(1, Math.floor(milliseconds / 1_000));
}

function asPayload(decoded: string | JwtPayload): JwtPayload {
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function generateAccessToken(input: AccessTokenInput): string {
  return jwt.sign(
    {
      userId: input.userId,
      email: input.email,
      role: input.role,
      sessionId: input.sessionId,
      type: "access",
    },
    getJwtSecret(),
    { expiresIn: toSeconds(getAccessTokenTtlMs()) },
  );
}

export function generateRefreshToken(input: RefreshTokenInput): string {
  return jwt.sign(
    {
      userId: input.userId,
      sessionId: input.sessionId,
      type: "refresh",
    },
    getRefreshSecret(),
    {
      expiresIn: toSeconds(getRefreshTokenTtlMs()),
      jwtid: crypto.randomUUID(),
    },
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = asPayload(jwt.verify(token, getJwtSecret()));
  const isAccessToken =
    payload.type === "access" || payload.type === undefined;

  if (
    !isAccessToken ||
    !isNonEmptyString(payload.userId) ||
    !isNonEmptyString(payload.email) ||
    !isNonEmptyString(payload.role)
  ) {
    throw new Error("Unauthorized: Invalid access token");
  }

  return {
    ...payload,
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: isNonEmptyString(payload.sessionId)
      ? payload.sessionId
      : "",
    type: "access",
  };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = asPayload(jwt.verify(token, getRefreshSecret()));

  if (
    payload.type !== "refresh" ||
    !isNonEmptyString(payload.userId) ||
    !isNonEmptyString(payload.sessionId)
  ) {
    throw new Error("Unauthorized: Invalid refresh token");
  }

  return {
    ...payload,
    userId: payload.userId,
    sessionId: payload.sessionId,
    type: "refresh",
  };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function compareTokenHash(rawToken: string, storedHash: string): boolean {
  const computed = Buffer.from(hashToken(rawToken), "utf8");
  const stored = Buffer.from(storedHash, "utf8");

  if (computed.length !== stored.length) {
    return false;
  }

  return crypto.timingSafeEqual(computed, stored);
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
