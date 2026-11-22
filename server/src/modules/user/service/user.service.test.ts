import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";

import { UserService } from "./user.service.ts";
import type { UserRepository } from "../repo/user.repo.ts";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("UserService", () => {
  const userRepository = {
    create: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    updateAuthFields: vi.fn(),
    delete: vi.fn(),
    incrementTokenVersion: vi.fn(),
  };

  const authSessionRepository = { revokeAllForUser: vi.fn() };
  const mailer = { sendPasswordResetEmail: vi.fn() };
  const audit = { record: vi.fn() };
  const tokenVersionMaintenance = { invalidate: vi.fn() };

  const createService = () =>
    new UserService(
      userRepository as unknown as UserRepository,
      authSessionRepository as never,
      mailer as never,
      audit,
      tokenVersionMaintenance,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CLIENT_URL = "http://localhost:5173";
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.incrementTokenVersion.mockResolvedValue(1);
    userRepository.updateAuthFields.mockResolvedValue(null);
    authSessionRepository.revokeAllForUser.mockResolvedValue(undefined);
    mailer.sendPasswordResetEmail.mockResolvedValue(undefined);
    audit.record.mockResolvedValue(undefined);
    tokenVersionMaintenance.invalidate.mockResolvedValue(undefined);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
  });

  it("creates an admin user as verified with a hashed password", async () => {
    userRepository.create.mockImplementation(
      (data: Record<string, unknown>) => data,
    );

    const result = await createService().createUser(
      {
        name: "Asha Sharma",
        email: "asha@example.com",
        password: "password123",
        role: "pharmacist",
      },
      "owner",
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
    expect(userRepository.create).toHaveBeenCalledWith({
      name: "Asha Sharma",
      email: "asha@example.com",
      password: "hashed-password",
      role: "pharmacist",
      emailVerified: true,
    });
    expect(result).toMatchObject({
      password: "hashed-password",
      emailVerified: true,
    });
  });

  it("rejects user creation by a pharmacist", async () => {
    await expect(
      createService().createUser(
        {
          name: "Asha Sharma",
          email: "asha@example.com",
          password: "password123",
          role: "owner",
        },
        "pharmacist",
      ),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "Only owners can manage users",
    });

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("hashes a password supplied through updateUser", async () => {
    userRepository.update.mockResolvedValue({ _id: "user-1" });

    await createService().updateUser(
      "user-1",
      { password: "newPassword123" },
      "owner",
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      password: "hashed-password",
    });
    expect(
      authSessionRepository.revokeAllForUser,
    ).toHaveBeenCalledWith("user-1");
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith(
      "user-1",
    );
  });

  it("rejects an invalid role on update", async () => {
    await expect(
      createService().updateUser(
        "user-1",
        { role: "super-admin" as never },
        "owner",
      ),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid role specified",
    });

    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("rejects an update without an id", async () => {
    await expect(
      createService().updateUser("", { name: "No ID" }, "owner"),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("deletes a user for an owner without trusting a role argument", async () => {
    userRepository.delete.mockResolvedValue({ _id: "user-1" });

    await createService().deleteUser("user-1", "owner");

    expect(userRepository.delete).toHaveBeenCalledWith("user-1");
  });

  it("rejects deletion by a non-owner", async () => {
    await expect(
      createService().deleteUser("user-1", "pharmacist"),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it("changes a role only after confirming the user exists", async () => {
    userRepository.findById.mockResolvedValue({ _id: "user-1" });
    userRepository.update.mockResolvedValue({ _id: "user-1", role: "owner" });

    await createService().changeRole("user-1", "owner", "owner");

    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      role: "owner",
    });
    expect(
      authSessionRepository.revokeAllForUser,
    ).toHaveBeenCalledWith("user-1");
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith(
      "user-1",
    );
  });

  it("rejects a role change when the user is missing", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      createService().changeRole("missing", "owner", "owner"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("toggles activation for an owner", async () => {
    userRepository.findById.mockResolvedValue({ isActive: true });

    await createService().toggleUserActivation("user-1", "owner");

    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      isActive: false,
    });
  });

  it("rejects activation changes by a non-owner", async () => {
    await expect(
      createService().toggleUserActivation("user-1", "inventory_manager"),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("sends an admin reset link, revokes sessions, and bumps the version", async () => {
    userRepository.findById.mockResolvedValue({
      _id: "user-1",
      name: "Asha Sharma",
      email: "asha@example.com",
      provider: "local",
    });

    await expect(
      createService().adminResetPassword(
        "user-1",
        "owner",
        "owner-1",
        { ip: "203.0.113.10", userAgent: "test" } as never,
      ),
    ).resolves.toMatchObject({
      message: expect.stringContaining("reset link sent"),
    });

    expect(userRepository.updateAuthFields).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        passwordResetTokenHash: expect.any(String),
        passwordResetExpiresAt: expect.any(Date),
      }),
    );
    expect(
      authSessionRepository.revokeAllForUser,
    ).toHaveBeenCalledWith("user-1");
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith(
      "user-1",
    );
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "asha@example.com",
        url: expect.stringContaining(
          "http://localhost:5173/reset-password?token=",
        ),
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_PASSWORD_RESET" }),
    );
  });

  it("clears the reset token when admin reset email delivery fails", async () => {
    userRepository.findById.mockResolvedValue({
      _id: "user-1",
      name: "Asha Sharma",
      email: "asha@example.com",
      provider: "local",
    });
    mailer.sendPasswordResetEmail.mockRejectedValue(new Error("smtp down"));

    await expect(
      createService().adminResetPassword("user-1", "owner"),
    ).rejects.toMatchObject({ statusCode: 503 });

    expect(userRepository.updateAuthFields).toHaveBeenLastCalledWith(
      "user-1",
      { passwordResetTokenHash: null, passwordResetExpiresAt: null },
    );
  });

  it("rejects admin reset for non-owners", async () => {
    await expect(
      createService().adminResetPassword("user-1", "pharmacist"),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("force-logs out a user and bumps the token version", async () => {
    userRepository.findById.mockResolvedValue({ _id: "user-1" });

    await expect(
      createService().forceLogout("user-1", "owner", "owner-1"),
    ).resolves.toMatchObject({
      message: expect.stringContaining("revoked"),
    });

    expect(
      authSessionRepository.revokeAllForUser,
    ).toHaveBeenCalledWith("user-1");
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith(
      "user-1",
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "USER_FORCE_LOGOUT" }),
    );
  });
});
