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
    return await this.model.findById(id).lean().exec();
  }

  async findByKey(key: string): Promise<INotificationTemplate | null> {
    return await this.model.findOne({ key }).lean().exec();
  }

  async update(
    id: string,
    data: UpdateNotificationTemplateDto,
  ): Promise<INotificationTemplate | null> {
    return await this.model
      .findByIdAndUpdate(id, data, { new: true })
      .lean()
      .exec();
  }

  async delete(id: string): Promise<INotificationTemplate | null> {
    return await this.model.findByIdAndDelete(id).lean().exec();
  }
}

export type { CreateNotificationTemplateDto };
