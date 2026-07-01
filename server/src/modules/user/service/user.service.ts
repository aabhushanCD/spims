import bcrypt from "bcrypt";

import { AppError } from "../../../shared/error.js";
import type { IUser } from "../model/user.model.js";
import type { UserRepository } from "../repo/user.repo.js";
import type { CreateUserDto, UpdateUserDto } from "../schema/user.schema.js";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: CreateUserDto): Promise<IUser> {
    if (
      userData.role &&
      !["inventory_manager", "owner", "pharmacist"].includes(userData.role)
    ) {
      throw AppError.unauthorized("Invalid role specified");
    }
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw AppError.conflict("Email already exists");
    }

    const hashPassword = await bcrypt.hash(userData.password, 10);
    return await this.userRepository.create({
      ...userData,
      password: hashPassword,
    });
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    return await this.userRepository.findById(id);
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<IUser | null> {
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: string, role: string): Promise<IUser | null> {
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    if (role !== "owner") {
      throw AppError.unauthorized("Only owners can delete users");
    }
    return await this.userRepository.delete(id);
  }

  async getAllUsers(): Promise<IUser[]> {
    return await this.userRepository.findAll();
  }

  async getUsersByRole(
    role: "owner" | "pharmacist" | "inventory_manager",
  ): Promise<IUser[]> {
    return await this.userRepository.findByRole(role);
  }

  async getActiveUsers(): Promise<IUser[]> {
    return await this.userRepository.findActiveUsers();
  }

  async getInactiveUsers(): Promise<IUser[]> {
    return await this.userRepository.findInactiveUsers();
  }

  async getUsersByStatusAndLastLogin(
    isActive: boolean,
    date: Date,
  ): Promise<IUser[]> {
    return await this.userRepository.findByStatusAndLastLogin(isActive, date);
  }

  async getUsersByRoleAndLastLogin(
    role: "owner" | "pharmacist" | "inventory_manager",
    date: Date,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndLastLogin(role, date);
  }

  async getUsersByRoleAndStatus(
    role: "owner" | "pharmacist" | "inventory_manager",
    isActive: boolean,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndStatus(role, isActive);
  }

  async getUsersByLastLogin(date: Date): Promise<IUser[]> {
    return await this.userRepository.findUsersByLastLogin(date);
  }
}
