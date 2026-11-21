import type { Model } from "mongoose";
import type { IUser } from "../model/user.model.js";
import type { CreateUserDto, UpdateUserDto } from "../schema/user.schema.js";
import type mongoose from "mongoose";
import { escapeRegex } from "../../../shared/utils/escapeRegex.ts";
import {
  cursorFilter,
  type PageCursor,
} from "../../../shared/pagination/cursor.ts";

export type AuthUserUpdate = Partial<
  Pick<
    IUser,
    | "password"
    | "emailVerified"
    | "lastLogin"
    | "refreshToken"
    | "refreshTokenExpiresAt"
    | "emailVerificationTokenHash"
    | "emailVerificationExpiresAt"
    | "passwordResetTokenHash"
    | "passwordResetExpiresAt"
  >
>;

export type CreateUserWithAuthFields = CreateUserDto &
  Partial<
    Pick<
      IUser,
      | "emailVerified"
      | "emailVerificationTokenHash"
      | "emailVerificationExpiresAt"
      | "passwordResetTokenHash"
      | "passwordResetExpiresAt"
      | "refreshToken"
      | "refreshTokenExpiresAt"
    >
  >;

export class UserRepository {
  constructor(private readonly userModel: Model<IUser>) {}

  async create(userData: CreateUserWithAuthFields): Promise<IUser> {
    const user = new this.userModel(userData);
    return await user.save();
  }

  async findById(
    id: string,
    session?: mongoose.ClientSession,
  ): Promise<IUser | null> {
    if (session) {
      return await this.userModel.findById(id).session(session).exec();
    }
    return await this.userModel.findById(id).exec();
  }

  async findByIds(ids: string[]): Promise<IUser[]> {
    if (ids.length === 0) {
      return [];
    }
    return await this.userModel.find({ _id: { $in: ids } }).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.userModel.findOne({ email }).lean();
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await this.userModel
      .findOne({ email })
      .select("+password")
      .lean();
  }

  async findByPasswordResetTokenHash(
    tokenHash: string,
  ): Promise<IUser | null> {
    return await this.userModel
      .findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { $gt: new Date() },
      })
      .select("+passwordResetTokenHash +passwordResetExpiresAt")
      .lean();
  }

  async findByEmailVerificationTokenHash(
    tokenHash: string,
  ): Promise<IUser | null> {
    return await this.userModel
      .findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
      })
      .select("+emailVerificationTokenHash +emailVerificationExpiresAt")
      .lean();
  }

  async updateAuthFields(
    id: string,
    updateData: AuthUserUpdate,
  ): Promise<IUser | null> {
    return await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async update(id: string, updateData: UpdateUserDto): Promise<IUser | null> {
    return await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<IUser | null> {
    return await this.userModel.findByIdAndDelete(id).exec();
  }

  async findAll(): Promise<IUser[]> {
    return await this.userModel.find().lean();
  }

  async findPage(
    filters: {
      search?: string;
      role?: "owner" | "pharmacist" | "inventory_manager";
      isActive?: boolean;
    },
    cursor: PageCursor | null,
    limit: number,
  ): Promise<IUser[]> {
    const conditions: Record<string, unknown>[] = [];
    if (filters.role) {
      conditions.push({ role: filters.role });
    }
    if (filters.isActive !== undefined) {
      conditions.push({ isActive: filters.isActive });
    }
    if (filters.search) {
      const regex = new RegExp(escapeRegex(filters.search), "i");
      conditions.push({ $or: [{ name: regex }, { email: regex }] });
    }
    const cursorClause = cursorFilter("createdAt", cursor);
    if (Object.keys(cursorClause).length > 0) {
      conditions.push(cursorClause);
    }
    const query = conditions.length > 0 ? { $and: conditions } : {};

    return this.userModel
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  async findByRole(
    role: "owner" | "pharmacist" | "inventory_manager",
  ): Promise<IUser[]> {
    return await this.userModel.find({ role }).exec();
  }

  async findActiveUsers(): Promise<IUser[]> {
    return await this.userModel.find({ isActive: true }).exec();
  }

  async findInactiveUsers(): Promise<IUser[]> {
    return await this.userModel.find({ isActive: false }).exec();
  }

  async findIdsByRole(
    role: "owner" | "pharmacist" | "inventory_manager",
  ): Promise<string[]> {
    const users = await this.userModel
      .find({ role })
      .select("_id")
      .lean()
      .exec();

    return users.map((user) => user._id.toString());
  }

  async findUsersByLastLogin(date: Date): Promise<IUser[]> {
    return await this.userModel.find({ lastLogin: { $gte: date } }).exec();
  }

  async getUsersByLastLogin(date: Date): Promise<IUser[]> {
    return await this.userModel.find({ lastLogin: { $gte: date } }).exec();
  }

  async findByRoleAndStatus(
    role: "owner" | "pharmacist" | "inventory_manager",
    isActive: boolean,
  ): Promise<IUser[]> {
    return await this.userModel.find({ role, isActive }).exec();
  }

  async findByStatusAndLastLogin(
    isActive: boolean,
    date: Date,
  ): Promise<IUser[]> {
    return await this.userModel
      .find({ isActive, lastLogin: { $gte: date } })
      .exec();
  }

  async findByRoleAndLastLogin(
    role: "owner" | "pharmacist" | "inventory_manager",
    date: Date,
  ): Promise<IUser[]> {
    return await this.userModel
      .find({ role, lastLogin: { $gte: date } })
      .exec();
  }

  async getNotificationPreferences(
    userId: string,
  ): Promise<{ email: boolean; sms: boolean } | null> {
    const user = await this.userModel
      .findById(userId)
      .select("notificationPreferences")
      .lean()
      .exec();
    if (!user) {
      return null;
    }
    return {
      email: user.notificationPreferences?.email ?? true,
      sms: user.notificationPreferences?.sms ?? true,
    };
  }

  async updateNotificationPreferences(
    userId: string,
    patch: { email?: boolean | undefined; sms?: boolean | undefined },
  ): Promise<{ email: boolean; sms: boolean } | null> {
    const set: Record<string, boolean> = {};
    if (patch.email !== undefined) {
      set["notificationPreferences.email"] = patch.email;
    }
    if (patch.sms !== undefined) {
      set["notificationPreferences.sms"] = patch.sms;
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: set }, { new: true })
      .lean()
      .exec();
    if (!user) {
      return null;
    }
    return {
      email: user.notificationPreferences?.email ?? true,
      sms: user.notificationPreferences?.sms ?? true,
    };
  }
}
