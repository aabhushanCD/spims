// notification.controller.ts
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error.ts";
import type { NotificationService } from "../services/notification.service.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // POST /notifications
  // body: { title, message, type: "Email" | "SMS" | "InApp", userIds: string[] }
  // Creates + fans out to recipients, then dispatches asynchronously
  // (fire-and-forget inside the service) — this responds as soon as the
  // notification + recipient rows are created, not after delivery completes.
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    const { title, message, type, userIds } = req.body;

    if (!title || !message) {
      throw AppError.badRequest("title and message are required");
    }
    if (!["Email", "SMS", "InApp"].includes(type)) {
      throw AppError.badRequest("type must be Email, SMS, or InApp");
    }
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw AppError.badRequest("userIds must be a non-empty array");
    }

    const notification = await this.notificationService.createNotification({
      title,
      message,
      type,
      userIds,
    });

    res.status(201).json({ success: true, data: notification });
  });

  // POST /notifications/:id/dispatch
  // Manual re-trigger — useful for retrying Pending/Failed recipients
  // without recreating the whole notification.
  dispatch = asyncHandler(async (req: Request, res: Response) => {
    const notification = await this.notificationService.dispatch(req.params.id as string); ;
    res.status(200).json({ success: true, data: notification });
  });

  // GET /notifications/:id
  getById = asyncHandler(async (req: Request, res: Response) => {
    const notification = await this.notificationService.getById(req.params.id as string);
    res.status(200).json({ success: true, data: notification });
  });

  // GET /notifications
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const notifications = await this.notificationService.getAll();
    res.status(200).json({ success: true, data: notifications });
  });

  // GET /notifications/me — current authenticated user's notification inbox
  getForCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw AppError.unauthorized("Authenticated user required");
    }
    const notifications = await this.notificationService.getForUser(userId);
    res.status(200).json({ success: true, data: notifications });
  });

  // GET /notifications/user/:userId — admin lookup for a specific user
  getForUser = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await this.notificationService.getForUser(
      req.params.userId as string,
    );
    res.status(200).json({ success: true, data: notifications });
  });

  // DELETE /notifications/:id
  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.notificationService.delete(req.params.id as string);
    res.status(200).json({ success: true, message: "Notification deleted" });
  });
}
