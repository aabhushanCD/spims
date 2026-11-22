import mongoose from "mongoose";

import type NotificationTemplate from "../model/notificationTemplate.model.ts";
import type { INotificationTemplate } from "../model/notificationTemplate.model.ts";
import type {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from "../schema/notificationTemplate.schema.ts";

export class NotificationTemplateRepo {
  constructor(private readonly model: typeof NotificationTemplate) {}

  async create(
    data: CreateNotificationTemplateDto,
  ): Promise<INotificationTemplate> {
    return await this.model.create({
      ...data,
      isActive: data.isActive ?? true,
    });
  }

  async findAll(): Promise<INotificationTemplate[]> {
    return await this.model.find().sort({ key: 1 }).lean().exec();
  }

  async findById(id: string): Promise<INotificationTemplate | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.model
      .findById(new mongoose.Types.ObjectId(id))
      .lean()
      .exec();
  }

  async findByKey(key: string): Promise<INotificationTemplate | null> {
    return await this.model
      .findOne()
      .where("key")
      .equals(key)
      .lean()
      .exec();
  }

  async update(
    id: string,
    data: UpdateNotificationTemplateDto,
  ): Promise<INotificationTemplate | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const template = await this.model
      .findById(new mongoose.Types.ObjectId(id))
      .exec();
    if (!template) {
      return null;
    }

    if (data.key !== undefined) template.key = data.key;
    if (data.name !== undefined) template.name = data.name;
    if (data.channel !== undefined) template.channel = data.channel;
    if (data.subject !== undefined) template.subject = data.subject;
    if (data.body !== undefined) template.body = data.body;
    if (data.isActive !== undefined) template.isActive = data.isActive;

    await template.save();
    return template.toObject() as INotificationTemplate;
  }

  async delete(id: string): Promise<INotificationTemplate | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.model
      .findByIdAndDelete(new mongoose.Types.ObjectId(id))
      .lean()
      .exec();
  }
}

export type { CreateNotificationTemplateDto };
