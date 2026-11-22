import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";

import { AuthService } from "./auth.service.ts";
import { AppError } from "../../../shared/error.ts";
import type { UserRepository } from "../../user/repo/user.repo.js";
import type { AuthSessionRepo } from "../repo/authSession.repo.ts";
import type { AuthMailer } from "./auth.mailer.ts";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/authTokens.ts";
import type { RequestContext } from "../../../shared/utils/requestContext.ts";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
};

const requestContext: RequestContext = {
  ip: "203.0.113.10",
  userAgent: "Mozilla/5.0",
  device: "Chrome on Windows",
  browser: "Chrome",
  os: "Windows",
  location: "Kathmandu, Bagmati, NP",
};

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: "user-1",
    name: "Asha Sharma",
    email: "asha@example.com",
    password: "hashed-password",
    role: "pharmacist",
    isActive: true,
    emailVerified: true,
    provider: "local",
    lastLogin: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("AuthService", () => {
  const userRepository = {
    findByEmail: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateAuthFields: vi.fn(),
    incrementTokenVersion: vi.fn(),
    findByPasswordResetTokenHash: vi.fn(),
    findByEmailVerificationTokenHash: vi.fn(),
  };

  const authSessionRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findActiveByUserId: vi.fn(),
    updateRefresh: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
    revokeOldestForUser: vi.fn(),
  };

  const mailer = {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
  };

  const loginAttemptTracker = {
    check: vi.fn(),
    recordFailure: vi.fn(),
    recordSuccess: vi.fn(),
  };

  const audit = { record: vi.fn() };
  const sessionRevocation = { revokeSessionAccessToken: vi.fn() };
  const tokenVersionMaintenance = { invalidate: vi.fn() };

  const createService = () =>
    new AuthService(
      userRepository as unknown as UserRepository,
      authSessionRepository as unknown as AuthSessionRepo,
      AppError,
      mailer as unknown as AuthMailer,
      loginAttemptTracker,
      audit,
      sessionRevocation,
      tokenVersionMaintenance,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-access-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
    process.env.CLIENT_URL = "http://localhost:5173";
    mailer.sendVerificationEmail.mockResolvedValue(undefined);
    mailer.sendPasswordResetEmail.mockResolvedValue(undefined);
    authSessionRepository.create.mockResolvedValue({});
    authSessionRepository.updateRefresh.mockResolvedValue({});
    authSessionRepository.revoke.mockResolvedValue(undefined);
    authSessionRepository.revokeAllForUser.mockResolvedValue(undefined);
    authSessionRepository.revokeOldestForUser.mockResolvedValue(undefined);
    userRepository.updateAuthFields.mockResolvedValue(null);
    userRepository.incrementTokenVersion.mockResolvedValue(1);
    loginAttemptTracker.check.mockResolvedValue({
      locked: false,
      retryAfterSeconds: 0,
    });
    loginAttemptTracker.recordFailure.mockResolvedValue({
      locked: false,
      retryAfterSeconds: 0,
    });
    loginAttemptTracker.recordSuccess.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
    sessionRevocation.revokeSessionAccessToken.mockResolvedValue(undefined);
    tokenVersionMaintenance.invalidate.mockResolvedValue(undefined);
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

  describe("registerUser", () => {
    it("rejects with a conflict when the email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser());

      await expect(
        createService().registerUser({
          email: "ASHA@example.com",
          password: "password123",
          name: "Asha Sharma",
        }),
      ).rejects.toMatchObject({
        message: "An account with this email already exists",
        statusCode: 409,
      });

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("creates an unverified pharmacist and sends a verification email", async () => {
      const createdUser = buildUser({
        emailVerified: false,
        email: "asha@example.com",
      });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(createdUser);
      vi.mocked(bcrypt.hash).mockResolvedValue(
        "hashed-password" as never,
      );

      const result = await createService().registerUser({
        email: "ASHA@example.com",
        password: "password123",
        name: "Asha Sharma",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "asha@example.com",
          role: "pharmacist",
          emailVerified: false,
          password: "hashed-password",
          emailVerificationTokenHash: expect.any(String),
          emailVerificationExpiresAt: expect.any(Date),
        }),
      );
      expect(mailer.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "asha@example.com",
          name: "Asha Sharma",
          url: expect.stringContaining(
            "http://localhost:5173/verify-email?token=",
          ),
        }),
      );
      expect(result.user).toMatchObject({
        email: "asha@example.com",
        emailVerified: false,
      });
      expect(result.user).not.toHaveProperty("password");
    });

    it("still creates the account when the verification email fails", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(
        buildUser({ emailVerified: false }),
      );
      vi.mocked(bcrypt.hash).mockResolvedValue(
        "hashed-password" as never,
      );
      mailer.sendVerificationEmail.mockRejectedValue(
        new Error("SMTP down"),
      );

      await expect(
        createService().registerUser({
          email: "asha@example.com",
          password: "password123",
          name: "Asha Sharma",
        }),
      ).resolves.toMatchObject({
        message: expect.stringContaining("check your email"),
      });
    });
  });

  describe("loginUser", () => {
    it("rejects unknown email and missing password with the same message", async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        createService().loginUser(
          { email: "missing@example.com", password: "password123" },
          requestContext,
        ),
      ).rejects.toMatchObject({
        message: "Invalid email or password",
        statusCode: 401,
      });
    });

    it("rejects a deactivated account after verifying the password", async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(
        buildUser({ isActive: false }),
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        createService().loginUser(
          { email: "asha@example.com", password: "password123" },
          requestContext,
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: "ACCOUNT_DEACTIVATED",
      });
    });

    it("rejects an unverified account with EMAIL_NOT_VERIFIED", async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(
        buildUser({ emailVerified: false }),
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(
        createService().loginUser(
          { email: "asha@example.com", password: "password123" },
          requestContext,
        ),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: "EMAIL_NOT_VERIFIED",
      });
      expect(bcrypt.compare).toHaveBeenCalledOnce();
    });

    it("returns public user data and a refresh session on success", async () => {
      const userId = "507f1f77bcf86cd799439011";
      userRepository.findByEmailWithPassword.mockResolvedValue(
        buildUser({ _id: userId }),
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await createService().loginUser(
        { email: "asha@example.com", password: "password123" },
        requestContext,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );
      expect(userRepository.updateAuthFields).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ lastLogin: expect.any(Date) }),
      );
      expect(authSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.anything(),
          refreshTokenHash: expect.any(String),
          device: "Chrome on Windows",
          ip: "203.0.113.10",
          location: "Kathmandu, Bagmati, NP",
        }),
      );
      expect(result.accessToken).toEqual(expect.any(String));
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.sessionId).toEqual(expect.any(String));
      expect(result.user).toMatchObject({
        email: "asha@example.com",
        emailVerified: true,
      });
      expect(result.user).not.toHaveProperty("password");
      expect(result.user).not.toHaveProperty("refreshToken");
    });

    it("rejects a locked account before checking credentials", async () => {
      loginAttemptTracker.check.mockResolvedValue({
        locked: true,
        retryAfterSeconds: 120,
      });

      await expect(
        createService().loginUser(
          { email: "asha@example.com", password: "password123" },
          requestContext,
        ),
      ).rejects.toMatchObject({
        statusCode: 423,
        code: "ACCOUNT_LOCKED",
        headers: { "Retry-After": "120" },
      });

      expect(userRepository.findByEmailWithPassword).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: "AUTH_LOGIN_LOCKED" }),
      );
    });

    it("records a failure and locks when the threshold is reached", async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(buildUser());
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      loginAttemptTracker.recordFailure.mockResolvedValue({
        locked: true,
        retryAfterSeconds: 900,
      });

      await expect(
        createService().loginUser(
          { email: "asha@example.com", password: "wrong-password" },
          requestContext,
        ),
      ).rejects.toMatchObject({
        statusCode: 423,
        code: "ACCOUNT_LOCKED",
      });

      expect(loginAttemptTracker.recordFailure).toHaveBeenCalledWith(
        "asha@example.com",
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AUTH_LOGIN_LOCKED",
          status: "FAILURE",
        }),
      );
    });

    it("clears the failure counter and audits a successful login", async () => {
      const userId = "507f1f77bcf86cd799439011";
      userRepository.findByEmailWithPassword.mockResolvedValue(
        buildUser({ _id: userId }),
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await createService().loginUser(
        { email: "asha@example.com", password: "password123" },
        requestContext,
      );

      expect(loginAttemptTracker.recordSuccess).toHaveBeenCalledWith(
        "asha@example.com",
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AUTH_LOGIN_SUCCESS",
          actorId: userId,
          status: "SUCCESS",
        }),
      );
    });
  });

  describe("refreshSession", () => {
    it("rejects a malformed refresh token", async () => {
      await expect(
        createService().refreshSession("not-a-jwt", requestContext),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    });

    it("rotates the stored hash and returns a new token pair", async () => {
      const refreshToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });
      const session = {
        _id: "session-1",
        userId: { toString: () => "user-1" },
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      };

      authSessionRepository.findById.mockResolvedValue(session);
      userRepository.findById.mockResolvedValue(buildUser());

      const result = await createService().refreshSession(
        refreshToken,
        requestContext,
      );

      expect(result.refreshToken).not.toBe(refreshToken);
      expect(result.sessionId).toBe("session-1");
      expect(authSessionRepository.updateRefresh).toHaveBeenCalledWith(
        "session-1",
        expect.objectContaining({
          refreshTokenHash: hashToken(result.refreshToken),
          lastUsedAt: expect.any(Date),
          expiresAt: expect.any(Date),
        }),
      );
      expect(result.user).not.toHaveProperty("password");
    });

    it("accepts the previous token during the rotation grace window", async () => {
      const previousToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });
      const currentToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });

      authSessionRepository.findById.mockResolvedValue({
        _id: "session-1",
        userId: { toString: () => "user-1" },
        refreshTokenHash: hashToken(currentToken),
        previousRefreshTokenHash: hashToken(previousToken),
        previousRefreshTokenExpiresAt: new Date(Date.now() + 30_000),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      userRepository.findById.mockResolvedValue(buildUser());

      const result = await createService().refreshSession(
        previousToken,
        requestContext,
      );

      expect(result.refreshToken).not.toBe(previousToken);
      expect(authSessionRepository.updateRefresh).toHaveBeenCalledOnce();
      expect(authSessionRepository.revoke).not.toHaveBeenCalled();
    });

    it("revokes the session when the stored hash does not match", async () => {
      const refreshToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });

      authSessionRepository.findById.mockResolvedValue({
        _id: "session-1",
        userId: { toString: () => "user-1" },
        refreshTokenHash: hashToken("a-different-token"),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        createService().refreshSession(refreshToken, requestContext),
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(authSessionRepository.revoke).toHaveBeenCalledWith(
        "session-1",
      );
      expect(authSessionRepository.updateRefresh).not.toHaveBeenCalled();
    });

    it("revokes the session when the user is deactivated", async () => {
      const refreshToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });

      authSessionRepository.findById.mockResolvedValue({
        _id: "session-1",
        userId: { toString: () => "user-1" },
        refreshTokenHash: hashToken(refreshToken),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
      });
      userRepository.findById.mockResolvedValue(
        buildUser({ isActive: false }),
      );

      await expect(
        createService().refreshSession(refreshToken, requestContext),
      ).rejects.toMatchObject({ statusCode: 401 });
      expect(authSessionRepository.revoke).toHaveBeenCalledWith(
        "session-1",
      );
    });
  });

  describe("email verification", () => {
    it("rejects an unknown verification token", async () => {
      userRepository.findByEmailVerificationTokenHash.mockResolvedValue(
        null,
      );

      await expect(
        createService().verifyEmail("a".repeat(64)),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_VERIFICATION_TOKEN",
      });
    });

    it("marks the email as verified and clears the token", async () => {
      userRepository.findByEmailVerificationTokenHash.mockResolvedValue(
        buildUser({ emailVerified: false }),
      );

      await expect(
        createService().verifyEmail("a".repeat(64)),
      ).resolves.toMatchObject({
        message: expect.stringContaining("verified"),
      });

      expect(userRepository.updateAuthFields).toHaveBeenCalledWith(
        "user-1",
        {
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      );
    });

    it("does not reveal whether an email exists when resending", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await createService().resendVerification(
        "missing@example.com",
      );

      expect(result.message).toContain("If an account exists");
      expect(mailer.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe("password reset", () => {
    it("returns a generic response for an unknown email", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await createService().requestPasswordReset(
        "missing@example.com",
      );

      expect(result.message).toContain("If an account exists");
      expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("stores a hashed reset token and sends the reset link", async () => {
      userRepository.findByEmail.mockResolvedValue(buildUser());

      await createService().requestPasswordReset("asha@example.com");

      expect(userRepository.updateAuthFields).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          passwordResetTokenHash: expect.any(String),
          passwordResetExpiresAt: expect.any(Date),
        }),
      );
      expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "asha@example.com",
          url: expect.stringContaining(
            "http://localhost:5173/reset-password?token=",
          ),
        }),
      );
    });

    it("rejects an invalid reset token", async () => {
      userRepository.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(
        createService().resetPassword("a".repeat(64), "newPassword123"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });
    });

    it("hashes the new password, verifies the email, and revokes sessions", async () => {
      userRepository.findByPasswordResetTokenHash.mockResolvedValue(
        buildUser({ emailVerified: false }),
      );
      vi.mocked(bcrypt.hash).mockResolvedValue(
        "new-hashed-password" as never,
      );

      await expect(
        createService().resetPassword(
          "a".repeat(64),
          "newPassword123",
        ),
      ).resolves.toMatchObject({
        message: expect.stringContaining("reset successfully"),
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
      expect(userRepository.updateAuthFields).toHaveBeenCalledWith(
        "user-1",
        {
          password: "new-hashed-password",
          emailVerified: true,
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          refreshToken: null,
          refreshTokenExpiresAt: null,
        },
      );
      expect(
        authSessionRepository.revokeAllForUser,
      ).toHaveBeenCalledWith("user-1");
      expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith(
        "user-1",
      );
      expect(tokenVersionMaintenance.invalidate).toHaveBeenCalledWith(
        "user-1",
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AUTH_PASSWORD_RESET_COMPLETED",
        }),
      );
    });
  });

  describe("sessions", () => {
    it("marks the current session and returns device metadata", async () => {
      authSessionRepository.findActiveByUserId.mockResolvedValue([
        {
          _id: "session-1",
          device: "Chrome on Windows",
          browser: "Chrome",
          os: "Windows",
          ip: "203.0.113.10",
          location: "Kathmandu, NP",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          lastUsedAt: new Date("2026-01-02T00:00:00.000Z"),
          expiresAt: new Date("2026-01-09T00:00:00.000Z"),
        },
      ]);

      const sessions = await createService().listSessions(
        "user-1",
        "session-1",
      );

      expect(sessions).toEqual([
        expect.objectContaining({
          id: "session-1",
          device: "Chrome on Windows",
          ip: "203.0.113.10",
          location: "Kathmandu, NP",
          isCurrent: true,
        }),
      ]);
    });

    it("does not allow revoking another user's session", async () => {
      authSessionRepository.findById.mockResolvedValue({
        _id: "session-1",
        userId: { toString: () => "another-user" },
      });

      await expect(
        createService().revokeSession("user-1", "session-1"),
      ).rejects.toMatchObject({ statusCode: 404 });
      expect(authSessionRepository.revoke).not.toHaveBeenCalled();
    });
  });

  describe("logoutSession", () => {
    it("revokes the session referenced by the refresh token", async () => {
      const refreshToken = generateRefreshToken({
        userId: "user-1",
        sessionId: "session-1",
      });

      await expect(
        createService().logoutSession(refreshToken),
      ).resolves.toMatchObject({
        message: "User logged out successfully",
      });

      expect(authSessionRepository.revoke).toHaveBeenCalledWith(
        "session-1",
      );
      expect(
        sessionRevocation.revokeSessionAccessToken,
      ).toHaveBeenCalledWith("session-1");
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AUTH_LOGOUT",
          entityId: "session-1",
        }),
      );
    });

    it("revokes the access token even when the refresh cookie is missing", async () => {
      const accessToken = generateAccessToken({
        userId: "user-1",
        email: "asha@example.com",
        role: "pharmacist",
        sessionId: "session-1",
        ver: 0,
      });

      await expect(
        createService().logoutSession(undefined, accessToken),
      ).resolves.toMatchObject({
        message: "User logged out successfully",
      });

      expect(
        sessionRevocation.revokeSessionAccessToken,
      ).toHaveBeenCalledWith("session-1");
      expect(authSessionRepository.revoke).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "AUTH_LOGOUT",
          entityId: "session-1",
        }),
      );
    });
  });

  describe("getCurrentUser", () => {
    it("rejects when the user is missing", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        createService().getCurrentUser("missing"),
      ).rejects.toMatchObject({
        message: "User not found",
        statusCode: 404,
      });
    });

    it("returns public user data without secrets", async () => {
      userRepository.findById.mockResolvedValue(buildUser());

      const result = await createService().getCurrentUser("user-1");

      expect(result).toMatchObject({
        _id: "user-1",
        email: "asha@example.com",
        emailVerified: true,
      });
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("refreshToken");
    });
  });
});
