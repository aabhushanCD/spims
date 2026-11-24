import bcrypt from "bcrypt";
import { Types } from "mongoose";

import { AppError } from "../../../shared/error.ts";
import type { IUser } from "../../user/model/user.model.ts";
import type { UserPreferences } from "../../user/types/preferences.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import type { AuthSessionRepo } from "../repo/authSession.repo.ts";
import type { CreateAuthSessionDto } from "../repo/authSession.repo.ts";
import type { LoginInputDto } from "../schema/login.schema.ts";
import type { RegisterInputDto } from "../schema/register.schema.ts";
import type { UpdatePreferencesDto } from "../../user/schema/preferences.schema.ts";
import type { RequestContext } from "../../../shared/utils/requestContext.ts";
import {
  getClientUrl,
  getEmailVerificationTtlMs,
  getMaxSessionsPerUser,
  getPasswordResetTtlMs,
  getRefreshReuseGraceMs,
  getRefreshTokenTtlMs,
} from "../utils/authConfig.ts";
import { AUDIT_ACTIONS } from "../../audit/audit.constants.ts";
import {
  noopAuditRecorder,
  noopLoginAttemptTracker,
  noopSessionRevocation,
  noopTokenVersionMaintenance,
  type AuditRecorder,
  type LoginAttemptTracker,
  type SessionRevocation,
  type TokenVersionMaintenance,
} from "../../../shared/security/security.types.ts";
import {
  compareTokenHash,
  generateAccessToken,
  generateOpaqueToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/authTokens.ts";
import {
  toPublicUser,
  type PublicUser,
} from "../../user/utils/publicUser.ts";
import type { AuthMailer } from "./auth.mailer.ts";
import { logger } from "../../../shared/logger.ts";

const GENERIC_RESET_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";
const GENERIC_VERIFICATION_MESSAGE =
  "If an account exists for that email and still needs verification, a new verification link has been sent.";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface AuthResult extends IssuedTokens {
  user: PublicUser;
}

export interface SessionSummary {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepo,
    private readonly appError: typeof AppError,
    private readonly mailer: AuthMailer,
    private readonly loginAttemptTracker: LoginAttemptTracker = noopLoginAttemptTracker,
    private readonly audit: AuditRecorder = noopAuditRecorder,
    private readonly sessionRevocation: SessionRevocation = noopSessionRevocation,
    private readonly tokenVersionMaintenance: TokenVersionMaintenance = noopTokenVersionMaintenance,
  ) {}

  async registerUser(userData: RegisterInputDto) {
    const email = userData.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw this.appError.conflict(
        "An account with this email already exists",
      );
    }

    const password = await bcrypt.hash(userData.password, 10);
    const verificationToken = generateOpaqueToken();
    const now = Date.now();

    const user = await this.userRepository.create({
      name: userData.name,
      email,
      password,
      // Public self-registration is always a pharmacist. Owners can change
      // the role from the user-management dashboard.
      role: "pharmacist",
      emailVerified: false,
      emailVerificationTokenHash: hashToken(verificationToken),
      emailVerificationExpiresAt: new Date(
        now + getEmailVerificationTtlMs(),
      ),
    });

    await this.sendVerificationEmail(user, verificationToken);

    return {
      message:
        "Account created. Please check your email to verify your address before signing in.",
      user: toPublicUser(user),
    };
  }

  async verifyEmail(token: string) {
    const user =
      await this.userRepository.findByEmailVerificationTokenHash(
        hashToken(token),
      );

    if (!user) {
      throw this.appError.badRequest(
        "This verification link is invalid or has expired",
        "INVALID_VERIFICATION_TOKEN",
      );
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt.getTime() <= Date.now()
    ) {
      throw this.appError.badRequest(
        "This verification link is invalid or has expired",
        "INVALID_VERIFICATION_TOKEN",
      );
    }

    await this.userRepository.updateAuthFields(String(user._id), {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    });

    await this.audit.record({
      actorId: String(user._id),
      action: AUDIT_ACTIONS.AUTH_EMAIL_VERIFIED,
      entityType: "User",
      entityId: String(user._id),
    });

    return {
      message: "Email verified successfully. You can now sign in.",
    };
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(
      email.toLowerCase(),
    );

    if (
      user &&
      user.provider === "local" &&
      user.isActive &&
      user.emailVerified === false
    ) {
      const verificationToken = generateOpaqueToken();
      const now = Date.now();

      await this.userRepository.updateAuthFields(String(user._id), {
        emailVerificationTokenHash: hashToken(verificationToken),
        emailVerificationExpiresAt: new Date(
          now + getEmailVerificationTtlMs(),
        ),
      });

      await this.sendVerificationEmail(user, verificationToken);
    }

    return { message: GENERIC_VERIFICATION_MESSAGE };
  }

  async loginUser(
    loginData: LoginInputDto,
    context: RequestContext,
  ): Promise<AuthResult> {
    const email = loginData.email.toLowerCase();

    const lockout = await this.loginAttemptTracker.check(email);
    if (lockout.locked) {
      await this.recordLoginAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_LOCKED,
        email,
        context,
        status: "FAILURE",
        reason: "account_locked",
      });
      throw this.accountLockedError(lockout.retryAfterSeconds);
    }

    const user = await this.userRepository.findByEmailWithPassword(email);

    if (!user || !user.password) {
      const state = await this.loginAttemptTracker.recordFailure(email);
      await this.recordLoginAudit({
        action: state.locked
          ? AUDIT_ACTIONS.AUTH_LOGIN_LOCKED
          : AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        email,
        context,
        status: "FAILURE",
        reason: state.locked ? "account_locked" : "invalid_credentials",
      });
      if (state.locked) {
        throw this.accountLockedError(state.retryAfterSeconds);
      }
      throw this.appError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      loginData.password,
      user.password,
    );

    if (!isPasswordValid) {
      const state = await this.loginAttemptTracker.recordFailure(email);
      await this.recordLoginAudit({
        action: state.locked
          ? AUDIT_ACTIONS.AUTH_LOGIN_LOCKED
          : AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        email,
        userId: String(user._id),
        role: user.role,
        context,
        status: "FAILURE",
        reason: state.locked ? "account_locked" : "invalid_credentials",
      });
      if (state.locked) {
        throw this.accountLockedError(state.retryAfterSeconds);
      }
      throw this.appError.unauthorized("Invalid email or password");
    }

    // A correct password clears the failure counter even if the account is
    // later rejected for being deactivated or unverified.
    await this.loginAttemptTracker.recordSuccess(email);

    // Status checks deliberately happen after the password comparison so an
    // attacker cannot enumerate deactivated or unverified accounts.
    if (!user.isActive) {
      await this.recordLoginAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        email,
        userId: String(user._id),
        role: user.role,
        context,
        status: "FAILURE",
        reason: "account_deactivated",
      });
      throw this.appError.forbidden(
        "This account has been deactivated. Contact an administrator.",
        "ACCOUNT_DEACTIVATED",
      );
    }

    if (user.emailVerified === false) {
      await this.recordLoginAudit({
        action: AUDIT_ACTIONS.AUTH_LOGIN_FAILURE,
        email,
        userId: String(user._id),
        role: user.role,
        context,
        status: "FAILURE",
        reason: "email_not_verified",
      });
      throw new AppError(
        "Please verify your email address before signing in",
        403,
        "EMAIL_NOT_VERIFIED",
      );
    }

    const loginAt = new Date();
    await this.userRepository.updateAuthFields(String(user._id), {
      lastLogin: loginAt,
    });

    const tokens = await this.issueSession(user, context);

    await this.recordLoginAudit({
      action: AUDIT_ACTIONS.AUTH_LOGIN_SUCCESS,
      email,
      userId: String(user._id),
      role: user.role,
      context,
    });

    return {
      user: toPublicUser({ ...user, lastLogin: loginAt }),
      ...tokens,
    };
  }

  async refreshSession(
    refreshToken: string,
    context: RequestContext,
  ): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw this.appError.unauthorized(
        "Your session has expired. Please sign in again.",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const session = await this.authSessionRepository.findById(
      payload.sessionId,
    );

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.userId.toString() !== payload.userId
    ) {
      throw this.appError.unauthorized(
        "Your session has expired. Please sign in again.",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const matchesCurrentToken = compareTokenHash(
      refreshToken,
      session.refreshTokenHash,
    );
    const matchesPreviousToken =
      session.previousRefreshTokenHash !== null &&
      session.previousRefreshTokenHash !== undefined &&
      session.previousRefreshTokenExpiresAt instanceof Date &&
      session.previousRefreshTokenExpiresAt.getTime() > Date.now() &&
      compareTokenHash(
        refreshToken,
        session.previousRefreshTokenHash,
      );

    if (!matchesCurrentToken && !matchesPreviousToken) {
      // The token is valid but does not match the current or recently rotated
      // hash. Treat it as possible reuse/theft and revoke the whole session.
      await this.authSessionRepository.revoke(String(session._id));
      await this.audit.record({
        actorId: payload.userId,
        action: AUDIT_ACTIONS.AUTH_REFRESH_REUSE_DETECTED,
        entityType: "AuthSession",
        entityId: String(session._id),
        status: "FAILURE",
        ip: context.ip,
        userAgent: context.userAgent,
      });
      throw this.appError.unauthorized(
        "Your session has expired. Please sign in again.",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const user = await this.userRepository.findById(payload.userId);

    if (!user || !user.isActive || user.emailVerified === false) {
      await this.authSessionRepository.revoke(String(session._id));
      throw this.appError.unauthorized(
        "Your session is no longer valid. Please sign in again.",
        "INVALID_REFRESH_TOKEN",
      );
    }

    const sessionId = String(session._id);
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      sessionId,
    });
    const accessToken = generateAccessToken({
      userId: payload.userId,
      email: user.email,
      role: user.role,
      sessionId,
      ver: user.tokenVersion ?? 0,
    });
    const now = Date.now();

    await this.authSessionRepository.updateRefresh(sessionId, {
      refreshTokenHash: hashToken(newRefreshToken),
      previousRefreshTokenHash: session.refreshTokenHash,
      previousRefreshTokenExpiresAt: new Date(
        now + getRefreshReuseGraceMs(),
      ),
      device: context.device,
      browser: context.browser,
      os: context.os,
      ip: context.ip,
      location: context.location,
      userAgent: context.userAgent,
      lastUsedAt: new Date(now),
      expiresAt: new Date(now + getRefreshTokenTtlMs()),
    });

    return {
      user: toPublicUser(user),
      accessToken,
      refreshToken: newRefreshToken,
      sessionId,
    };
  }

  async logoutSession(refreshToken?: string, accessToken?: string) {
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await this.authSessionRepository.revoke(payload.sessionId);
        await this.sessionRevocation.revokeSessionAccessToken(
          payload.sessionId,
        );
        await this.audit.record({
          actorId: payload.userId,
          action: AUDIT_ACTIONS.AUTH_LOGOUT,
          entityType: "AuthSession",
          entityId: payload.sessionId,
        });
        return { message: "User logged out successfully" };
      } catch {
        // Fall through to the access-token path below. An expired or malformed
        // refresh token must not prevent revoking a still-valid access token.
      }
    }

    if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        if (payload.sessionId) {
          await this.sessionRevocation.revokeSessionAccessToken(
            payload.sessionId,
          );
          await this.audit.record({
            actorId: payload.userId,
            action: AUDIT_ACTIONS.AUTH_LOGOUT,
            entityType: "AuthSession",
            entityId: payload.sessionId,
          });
        }
      } catch {
        // Expired/malformed access tokens are already unusable.
      }
    }

    return { message: "User logged out successfully" };
  }

  async logoutAllSessions(userId: string, context?: RequestContext) {
    await this.authSessionRepository.revokeAllForUser(userId);
    const tokenVersion = await this.userRepository.incrementTokenVersion(userId);
    if (tokenVersion !== null) {
      await this.tokenVersionMaintenance.invalidate(userId);
    }
    await this.audit.record({
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_LOGOUT_ALL,
      entityType: "User",
      entityId: userId,
      ip: context?.ip,
      userAgent: context?.userAgent,
    });

    return { message: "All sessions have been signed out" };
  }

  async listSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<SessionSummary[]> {
    const sessions =
      await this.authSessionRepository.findActiveByUserId(userId);

    return sessions.map((session) => ({
      id: String(session._id),
      device: session.device,
      browser: session.browser,
      os: session.os,
      ip: session.ip,
      location: session.location,
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: String(session._id) === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.authSessionRepository.findById(sessionId);

    if (!session || session.userId.toString() !== userId) {
      throw this.appError.notFound("Session not found");
    }

    await this.authSessionRepository.revoke(sessionId);
    await this.sessionRevocation.revokeSessionAccessToken(sessionId);
    await this.audit.record({
      actorId: userId,
      action: AUDIT_ACTIONS.AUTH_SESSION_REVOKED,
      entityType: "AuthSession",
      entityId: sessionId,
    });

    return {
      message: "Session revoked successfully",
      sessionId,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findByEmail(
      email.toLowerCase(),
    );

    if (user && user.provider === "local" && user.isActive) {
      const resetToken = generateOpaqueToken();
      const now = Date.now();

      await this.userRepository.updateAuthFields(String(user._id), {
        passwordResetTokenHash: hashToken(resetToken),
        passwordResetExpiresAt: new Date(
          now + getPasswordResetTtlMs(),
        ),
      });

      const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await this.audit.record({
        actorId: String(user._id),
        action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_REQUESTED,
        entityType: "User",
        entityId: String(user._id),
      });

      try {
        await this.mailer.sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          url: resetUrl,
        });
      } catch (error) {
        logger.error("password_reset_email_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
        await this.userRepository.updateAuthFields(String(user._id), {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        });
      }
    }

    return { message: GENERIC_RESET_MESSAGE };
  }

  async resetPassword(token: string, newPassword: string) {
    const user =
      await this.userRepository.findByPasswordResetTokenHash(
        hashToken(token),
      );

    if (
      !user ||
      !user.isActive ||
      (user.passwordResetExpiresAt &&
        user.passwordResetExpiresAt.getTime() <= Date.now())
    ) {
      throw this.appError.badRequest(
        "This reset link is invalid or has expired",
        "INVALID_RESET_TOKEN",
      );
    }

    const password = await bcrypt.hash(newPassword, 10);

    // Revoke sessions before changing the password. If revocation fails, the
    // password is not changed; if the password update then fails, the user is
    // merely signed out and can retry with the same reset link.
    await this.authSessionRepository.revokeAllForUser(String(user._id));

    // Invalidate access tokens before changing the password. If the password
    // write then fails, the user is merely signed out and can reuse the reset
    // link; the reverse order could leave old tokens valid after a successful
    // password change.
    const tokenVersion = await this.userRepository.incrementTokenVersion(
      String(user._id),
    );
    if (tokenVersion !== null) {
      await this.tokenVersionMaintenance.invalidate(String(user._id));
    }

    await this.userRepository.updateAuthFields(String(user._id), {
      password,
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    });

    await this.audit.record({
      actorId: String(user._id),
      action: AUDIT_ACTIONS.AUTH_PASSWORD_RESET_COMPLETED,
      entityType: "User",
      entityId: String(user._id),
    });

    return {
      message:
        "Password reset successfully. Please sign in with your new password.",
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw this.appError.notFound("User not found");
    }

    return toPublicUser(user);
  }

  /**
   * Self-service localization preferences. This deliberately lives on the auth
   * module's "current user" surface because the `/users` router is restricted
   * to owners and pharmacists, while every role must be able to set its own
   * language and calendar preference.
   */
  async updatePreferences(userId: string, preferences: UpdatePreferencesDto) {
    const changes: Partial<
      Pick<UserPreferences, "language" | "calendarMode">
    > = {};

    if (preferences.language !== undefined) {
      changes.language = preferences.language;
    }

    if (preferences.calendarMode !== undefined) {
      changes.calendarMode = preferences.calendarMode;
    }

    const user = await this.userRepository.updatePreferences(userId, changes);

    if (!user) {
      throw this.appError.notFound("User not found");
    }

    return toPublicUser(user);
  }

  private accountLockedError(retryAfterSeconds: number): AppError {
    return this.appError.locked(
      "Too many failed sign-in attempts. This account is temporarily locked.",
      "ACCOUNT_LOCKED",
      retryAfterSeconds,
    );
  }

  private async recordLoginAudit(input: {
    action: string;
    email: string;
    context: RequestContext;
    userId?: string;
    role?: string;
    status?: "SUCCESS" | "FAILURE";
    reason?: string;
  }): Promise<void> {
    await this.audit.record({
      actorId: input.userId,
      actorRole: input.role,
      action: input.action,
      entityType: "User",
      entityId: input.userId,
      status: input.status ?? "SUCCESS",
      ip: input.context.ip,
      userAgent: input.context.userAgent,
      metadata: {
        email: input.email,
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }

  private async issueSession(
    user: IUser,
    context: RequestContext,
  ): Promise<IssuedTokens> {
    const userId = String(user._id);
    const sessionId = new Types.ObjectId().toString();
    const refreshToken = generateRefreshToken({ userId, sessionId });
    const accessToken = generateAccessToken({
      userId,
      email: user.email,
      role: user.role,
      sessionId,
      ver: user.tokenVersion ?? 0,
    });
    const now = Date.now();

    const sessionData: CreateAuthSessionDto = {
      _id: sessionId,
      userId: new Types.ObjectId(userId),
      refreshTokenHash: hashToken(refreshToken),
      device: context.device,
      browser: context.browser,
      os: context.os,
      ip: context.ip,
      location: context.location,
      userAgent: context.userAgent,
      expiresAt: new Date(now + getRefreshTokenTtlMs()),
    };

    await this.authSessionRepository.create(sessionData);

    // Keep the number of active sessions bounded per account. A pruning
    // failure must not block an otherwise valid login.
    try {
      await this.authSessionRepository.revokeOldestForUser(
        userId,
        getMaxSessionsPerUser(),
      );
    } catch (error) {
      logger.warn("session_prune_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return { accessToken, refreshToken, sessionId };
  }

  private async sendVerificationEmail(
    user: IUser,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;

    try {
      await this.mailer.sendVerificationEmail({
        to: user.email,
        name: user.name,
        url: verificationUrl,
      });
    } catch (error) {
      // Registration must still succeed if the mail provider is down. The
      // user can request another verification email.
      logger.error("verification_email_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
