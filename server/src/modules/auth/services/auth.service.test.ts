import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service.ts";

import bcrypt from "bcrypt";
import { mock } from "node:test";

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe("AuthService", () => {
  const mockUserRepository = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const mockAppError = {
    conflict: vi.fn(),
    notFound: vi.fn(),
    badRequest: vi.fn(),
    unauthorized: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should throw conflict when user already exists", async () => {
    // Mock dependencies and data
    const existingUser = {
      _id: "123",
      email: "test@example.com",
    };

    mockUserRepository.findByEmail.mockResolvedValue(existingUser);
    mockAppError.conflict.mockImplementation(
      (message: string) => new Error(message),
    );

    const authService = new AuthService(
      mockUserRepository as any,
      mockAppError as any,
    );

    //Act
    const promise = authService.registerUser({
      email: "test@example.com",
      password: "password123",
    } as any);

    await expect(promise).rejects.toThrow("User already exists");

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      "test@example.com",
    );

    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it("should return User Register Successfully when user does not exist", async () => {
    // Mock dependencies and data

    const newUser = {
      name: "Hello",
      email: "hello1@gmail.com",
      password: "password123",
      role: "owner" as const,
    };

    const createdUser = {
      _id: "123",
      name: "Hello",
      email: "hello1@gmail.com",
      password: "hashedPassword",
      role: "owner" as const,
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    mockUserRepository.create.mockResolvedValue(createdUser);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);

    // Act
    const authService = new AuthService(
      mockUserRepository as any,
      mockAppError as any,
    );

    const result = await authService.registerUser(newUser);

    // Assert
    expect(result).toEqual(createdUser);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      "hello1@gmail.com",
    );

    expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);

    expect(mockUserRepository.create).toHaveBeenCalledWith({
      name: "Hello",
      email: "hello1@gmail.com",
      password: "hashedPassword",
      role: "owner",
    });
  });

  //   Hashing Failure

  it("should throw when password hashing fails", async () => {
    // arrange

    const newUser = {
      name: "Hello",
      email: "hello1@gmail.com",
      password: "password123",
      role: "owner" as const,
    };

    mockUserRepository.findByEmail.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockRejectedValue(new Error("Hashing Failed!"));

    const authService = new AuthService(
      mockUserRepository as any,
      mockAppError as any,
    );

    // Act
    const promise = authService.registerUser(newUser);

    // Assert

    await expect(promise).rejects.toThrow("Hashing Failed!");

    expect(mockUserRepository.create).not.toHaveBeenCalled();
  });

  it("should throw error if the user not found", async () => {
    // Arrange

    mockUserRepository.findByEmail.mockResolvedValue(null);

    mockAppError.notFound.mockImplementation(
      (message: string) => new Error(message),
    );

    const authService = new AuthService(
      mockUserRepository as any,
      mockAppError as any,
    );

    const promise = authService.loginUser({
      email: "test@gmail.com",
      password: "password123",
    });

    expect(promise).rejects.toThrow("User not found");

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
      "test@gmail.com",
    );
  });
});
