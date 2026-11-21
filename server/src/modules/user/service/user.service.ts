import bcrypt from "bcrypt";

import { AppError } from "../../../shared/error.js";
import type { IUser, UserRole } from "../model/user.model.js";
import type { UserRepository } from "../repo/user.repo.js";
import type {
  CreateUserDto,
  UpdateUserDto,
  UserListQuery,
} from "../schema/user.schema.js";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  private assertOwner(actorRole: string): void {
    if (actorRole !== "owner") {
      throw AppError.forbidden("Only owners can manage users");
    }
  }

  private assertValidRole(role: string): void {
    if (!["inventory_manager", "owner", "pharmacist"].includes(role)) {
      throw AppError.badRequest("Invalid role specified");
    }
  }

  async createUser(
    userData: CreateUserDto,
    actorRole: string,
  ): Promise<IUser> {
    this.assertOwner(actorRole);
    this.assertValidRole(userData.role);

    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw AppError.conflict("Email already exists");
    }

    const hashPassword = await bcrypt.hash(userData.password, 10);
    return await this.userRepository.create({
      ...userData,
      password: hashPassword,
      // Users created by an owner from the dashboard are trusted accounts.
      emailVerified: true,
    });
  }

  async getUserById(id: string): Promise<IUser | null> {
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    return await this.userRepository.findById(id);
  }

  async updateUser(
    id: string,
    userData: UpdateUserDto,
    actorRole: string,
  ): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }

    const updateData = { ...userData };

    if (updateData.role) {
      this.assertValidRole(updateData.role);
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id: string, actorRole: string): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    return await this.userRepository.delete(id);
  }

  async changeRole(
    id: string,
    role: UserRole,
    actorRole: string,
  ): Promise<IUser | null> {
    this.assertOwner(actorRole);
    if (!id) {
      throw AppError.badRequest("User ID is required");
    }
    this.assertValidRole(role);

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw AppError.notFound("User not found");
    }

    return await this.userRepository.update(id, { role });
  }

  async getUsersPage(query: UserListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.userRepository.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.role ? { role: query.role } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }

  async getAllUsers(): Promise<IUser[]> {
    return await this.userRepository.findAll();
  }

  async getUsersByRole(role: UserRole): Promise<IUser[]> {
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

  async toggleUserActivation(
    userId: string,
    actorRole: string,
  ): Promise<void> {
    this.assertOwner(actorRole);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    await this.userRepository.update(userId, { isActive: !user.isActive });
  }

  async getUsersByRoleAndLastLogin(
    role: UserRole,
    date: Date,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndLastLogin(role, date);
  }

  async getUsersByRoleAndStatus(
    role: UserRole,
    isActive: boolean,
  ): Promise<IUser[]> {
    return await this.userRepository.findByRoleAndStatus(role, isActive);
  }

  async getUsersByLastLogin(date: Date): Promise<IUser[]> {
    return await this.userRepository.findUsersByLastLogin(date);
  }
}
