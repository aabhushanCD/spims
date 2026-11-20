import type { CookieOptions, Response } from "express";

import {
  getAccessTokenTtlMs,
  getRefreshTokenTtlMs,
} from "./authConfig.ts";

export const ACCESS_COOKIE_NAME = "token";
export const REFRESH_COOKIE_NAME = "refreshToken";

function baseCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
  };
}

export function accessCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    path: "/",
    maxAge: getAccessTokenTtlMs(),
  };
}

export function refreshCookieOptions(): CookieOptions {
  return {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: getRefreshTokenTtlMs(),
  };
}

export interface AuthCookieTokens {
  accessToken: string;
  refreshToken: string;
}

export function setAuthCookies(
  res: Response,
  tokens: AuthCookieTokens,
): void {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
}

export function clearAuthCookies(res: Response): void {
  const base = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE_NAME, { ...base, path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...base, path: "/api/auth" });
}
