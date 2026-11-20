import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../../shared/error.ts";
import { extractRequestContext } from "../../../shared/utils/requestContext.ts";
import type { JWTUserPayload } from "../../../types/global.ts";
import type { EmailInputDto } from "../schema/email.schema.ts";
import type { LoginInputDto } from "../schema/login.schema.ts";
import type { RegisterInputDto } from "../schema/register.schema.ts";
import type { ResetPasswordInputDto } from "../schema/resetPassword.schema.ts";
import type { VerifyEmailInputDto } from "../schema/verifyEmail.schema.ts";
import type { AuthService } from "../services/auth.service.ts";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../utils/authCookies.ts";

function getRefreshToken(req: Request): string | undefined {
  const cookies: unknown = req.cookies;

  if (!cookies || typeof cookies !== "object") {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>).refreshToken;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getAuthenticatedUser(req: Request): JWTUserPayload {
  if (!req.user) {
    throw AppError.unauthorized("Unauthorized");
  }

  return req.user;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.registerUser(
        req.body as RegisterInputDto,
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body as VerifyEmailInputDto;
      const result = await this.authService.verifyEmail(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as EmailInputDto;
      const result = await this.authService.resendVerification(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.loginUser(
        req.body as LoginInputDto,
        extractRequestContext(req),
      );

      setAuthCookies(res, result);
      res.json(result.user);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = getRefreshToken(req);

      if (!refreshToken) {
        throw AppError.unauthorized(
          "Your session has expired. Please sign in again.",
          "INVALID_REFRESH_TOKEN",
        );
      }

      const result = await this.authService.refreshSession(
        refreshToken,
        extractRequestContext(req),
      );

      setAuthCookies(res, result);
      res.json(result.user);
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logoutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.authService.logoutSession(
        getRefreshToken(req),
      );
      clearAuthCookies(res);
      res.json(result);
    } catch (error) {
      clearAuthCookies(res);
      next(error);
    }
  }

  async logoutAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthenticatedUser(req);
      const result = await this.authService.logoutAllSessions(user.userId);
      clearAuthCookies(res);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthenticatedUser(req);
      const result = await this.authService.getCurrentUser(user.userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body as EmailInputDto;
      const result = await this.authService.requestPasswordReset(email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body as ResetPasswordInputDto;
      const result = await this.authService.resetPassword(token, password);
      clearAuthCookies(res);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async listSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthenticatedUser(req);
      const sessions = await this.authService.listSessions(
        user.userId,
        user.sessionId ?? "",
      );
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  }

  async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      const user = getAuthenticatedUser(req);
      const rawSessionId = req.params.id;
      const sessionId = Array.isArray(rawSessionId)
        ? rawSessionId[0]
        : rawSessionId;

      if (!sessionId) {
        throw AppError.badRequest("Session ID is required");
      }

      const result = await this.authService.revokeSession(
        user.userId,
        sessionId,
      );

      if (sessionId === user.sessionId) {
        clearAuthCookies(res);
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
