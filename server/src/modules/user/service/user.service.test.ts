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
  };

  const createService = () =>
    new UserService(userRepository as unknown as UserRepository);

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.findByEmail.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
  });

  it("creates an admin user as verified with a hashed password", async () => {
    userRepository.create.mockImplementation(
      (data: Record<string, unknown>) => data,
    );

    const result = await createService().createUser({
      name: "Asha Sharma",
      email: "asha@example.com",
      password: "password123",
      role: "pharmacist",
    });

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

  it("hashes a password supplied through updateUser", async () => {
    userRepository.update.mockResolvedValue({ _id: "user-1" });

    await createService().updateUser("user-1", {
      password: "newPassword123",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
    expect(userRepository.update).toHaveBeenCalledWith("user-1", {
      password: "hashed-password",
    });
  });

  it("rejects an invalid role on update", async () => {
    await expect(
      createService().updateUser("user-1", {
        role: "super-admin" as never,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid role specified",
    });

    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it("rejects an update without an id", async () => {
    await expect(
      createService().updateUser("", { name: "No ID" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
