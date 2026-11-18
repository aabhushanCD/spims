import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { AuthService } from "./auth.service.ts";
import { AppError } from "../../../shared/error.ts";
import { generateJwtToken } from "../../../shared/utils/generateJwtToken.js";
import type { UserRepository } from "../../user/repo/user.repo.js";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

vi.mock("../../../shared/utils/generateJwtToken.js", () => ({
  generateJwtToken: vi.fn(),
}));

const originalJwtSecret = process.env.JWT_SECRET;

describe("AuthService", () => {
  const userRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  };

  const createService = () =>
    new AuthService(
      userRepository as unknown as UserRepository,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterAll(() => {
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  describe("registerUser", () => {
    it("rejects with a conflict when the email already exists", async () => {
      userRepository.findByEmail.mockResolvedValue({
        _id: "123",
        email: "test@example.com",
      });

      const promise = createService().registerUser({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        role: "owner",
      });

      await expect(promise).rejects.toMatchObject({
        message: "User already exists",
        statusCode: 409,
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("hashes the password before creating the user", async () => {
      const newUser = {
        name: "Hello",
        email: "hello1@gmail.com",
        password: "password123",
        role: "owner" as const,
      };

      const createdUser = {
        _id: "123",
        ...newUser,
        password: "hashedPassword",
      };

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(createdUser);
      vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);

      const result = await createService().registerUser(newUser);

      expect(result).toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...newUser,
        password: "hashedPassword",
      });
    });

    it("propagates hashing failures without creating a user", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error("Hashing failed"));

      const promise = createService().registerUser({
        email: "hello1@gmail.com",
        password: "password123",
        name: "Hello",
        role: "owner",
      });

      await expect(promise).rejects.toThrow("Hashing failed");
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("loginUser", () => {
    const credentials = {
      email: "test@gmail.com",
      password: "password123",
    };

    it("rejects when the user does not exist", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const promise = createService().loginUser(credentials);

      await expect(promise).rejects.toMatchObject({
        message: "User not found",
        statusCode: 404,
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@gmail.com",
      );
    });

    it("rejects when the account has no password set", async () => {
      userRepository.findByEmail.mockResolvedValue({
        _id: "123",
        email: credentials.email,
        role: "owner",
      });

      const promise = createService().loginUser(credentials);

      await expect(promise).rejects.toMatchObject({
        message: "User does not have a password set",
        statusCode: 400,
      });
    });

    it("rejects an invalid password", async () => {
      userRepository.findByEmail.mockResolvedValue({
        _id: "123",
        email: credentials.email,
        password: "hashedPassword",
        role: "owner",
      });
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const promise = createService().loginUser(credentials);

      await expect(promise).rejects.toMatchObject({
        message: "Invalid password",
        statusCode: 401,
      });
      expect(generateJwtToken).not.toHaveBeenCalled();
    });

    it("returns the user and a signed token on success", async () => {
      const user = {
        _id: { toString: () => "user-1" },
        email: credentials.email,
        password: "hashedPassword",
        role: "pharmacist",
      };
      userRepository.findByEmail.mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(generateJwtToken).mockReturnValue("signed-token");

      const result = await createService().loginUser(credentials);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword",
      );
      expect(generateJwtToken).toHaveBeenCalledWith(
        {
          userId: "user-1",
          email: credentials.email,
          role: "pharmacist",
        },
        "test-jwt-secret",
      );
      expect(result).toMatchObject({
        email: credentials.email,
        token: "signed-token",
      });
    });
  });

  describe("getCurrentUser", () => {
    it("rejects when the user is missing", async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(createService().getCurrentUser("missing")).rejects.toMatchObject(
        { message: "User not found", statusCode: 404 },
      );
    });

    it("returns the current user", async () => {
      const user = { _id: "user-1", email: "test@gmail.com" };
      userRepository.findById.mockResolvedValue(user);

      await expect(createService().getCurrentUser("user-1")).resolves.toEqual(
        user,
      );
    });
  });
});
