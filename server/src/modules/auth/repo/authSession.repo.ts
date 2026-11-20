import type mongoose from "mongoose";

import type { IAuthSession } from "../model/authSession.model.ts";

export interface CreateAuthSessionDto {
  _id?: string;
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  userAgent: string;
  expiresAt: Date;
}

export interface UpdateAuthSessionDto {
  refreshTokenHash: string;
  previousRefreshTokenHash: string | null;
  previousRefreshTokenExpiresAt: Date | null;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  userAgent: string;
  expiresAt: Date;
  lastUsedAt: Date;
}

export class AuthSessionRepo {
  constructor(private readonly sessionModel: mongoose.Model<IAuthSession>) {}

  async create(data: CreateAuthSessionDto): Promise<IAuthSession> {
    const session = new this.sessionModel(data);
    return await session.save();
  }

  async findById(id: string): Promise<IAuthSession | null> {
    return await this.sessionModel.findById(id).lean().exec();
  }

  async findActiveByUserId(userId: string): Promise<IAuthSession[]> {
    return await this.sessionModel
      .find({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastUsedAt: -1 })
      .lean()
      .exec();
  }

  async updateRefresh(
    id: string,
    data: UpdateAuthSessionDto,
  ): Promise<IAuthSession | null> {
    return await this.sessionModel
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec();
  }

  async revoke(id: string): Promise<void> {
    await this.sessionModel
      .findByIdAndUpdate(id, { revokedAt: new Date() })
      .exec();
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.sessionModel
      .updateMany(
        { userId, revokedAt: null },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }

  async revokeOldestForUser(
    userId: string,
    keepCount: number,
  ): Promise<void> {
    const activeSessions = await this.sessionModel
      .find({
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastUsedAt: -1 })
      .select("_id")
      .lean()
      .exec();

    const staleSessions = activeSessions.slice(keepCount);
    if (staleSessions.length === 0) {
      return;
    }

    await this.sessionModel
      .updateMany(
        { _id: { $in: staleSessions.map((session) => session._id) } },
        { $set: { revokedAt: new Date() } },
      )
      .exec();
  }
}
