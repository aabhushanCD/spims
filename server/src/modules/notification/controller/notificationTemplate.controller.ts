import type { NextFunction, Request, Response } from "express";

import type {
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
} from "../schema/notificationTemplate.schema.ts";
import type { NotificationTemplateService } from "../service/notificationTemplate.service.ts";

export class NotificationTemplateController {
  constructor(private readonly service: NotificationTemplateService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.create(
        req.body as CreateNotificationTemplateDto,
      );
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, data: await this.service.getAll() });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.getById(req.params.id as string);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.update(
        req.params.id as string,
        req.body as UpdateNotificationTemplateDto,
      );
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.service.delete(req.params.id as string);
      res.status(200).json({ success: true, message: "Template deleted" });
    } catch (error) {
      next(error);
    }
  }

  async render(req: Request, res: Response, next: NextFunction) {
    try {
      const { data } = req.body as {
        data: Record<string, string | number | boolean>;
      };
      const rendered = await this.service.render(
        req.params.id as string,
        data,
      );
      res.status(200).json({ success: true, data: rendered });
    } catch (error) {
      next(error);
    }
  }
}
