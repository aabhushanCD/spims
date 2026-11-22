import { AppError } from "../../../shared/error.ts";
import type { NotificationTemplateRepo } from "../repo/notificationTemplate.repo.ts";
import type {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from "../schema/notificationTemplate.schema.ts";

export class NotificationTemplateService {
  constructor(private readonly repo: NotificationTemplateRepo) {}

  async create(data: CreateNotificationTemplateDto) {
    const existing = await this.repo.findByKey(data.key);
    if (existing) {
      throw AppError.conflict("A template with this key already exists");
    }
    return await this.repo.create(data);
  }

  async getAll() {
    return await this.repo.findAll();
  }

  async getById(id: string) {
    const template = await this.repo.findById(id);
    if (!template) {
      throw AppError.notFound("Notification template not found");
    }
    return template;
  }

  async update(id: string, data: UpdateNotificationTemplateDto) {
    const updated = await this.repo.update(id, data);
    if (!updated) {
      throw AppError.notFound("Notification template not found");
    }
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) {
      throw AppError.notFound("Notification template not found");
    }
    return deleted;
  }

  async render(
    id: string,
    data: Record<string, string | number | boolean>,
  ) {
    const template = await this.getById(id);
    if (!template.isActive) {
      throw AppError.badRequest("Notification template is inactive");
    }
    const render = (text: string) =>
      text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) =>
        Object.prototype.hasOwnProperty.call(data, key)
          ? String(data[key])
          : "",
      );
    return {
      key: template.key,
      channel: template.channel,
      subject: render(template.subject),
      body: render(template.body),
    };
  }
}
