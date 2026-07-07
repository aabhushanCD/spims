import type { Model } from "mongoose";
import type { IUser } from "../model/user.model.js";
import type { CreateUserDto, UpdateUserDto } from "../schema/user.schema.js";

export class UserRepository {
  constructor(private readonly userModel: Model<IUser>) {}

  async create(userData: CreateUserDto): Promise<IUser> {
    const user = new this.userModel(userData);
    return await user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.userModel.findOne({ email }).lean();
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
}
