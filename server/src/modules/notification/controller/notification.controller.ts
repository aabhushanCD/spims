// notification.controller.ts
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error.ts";
import type { UserRole } from "../../user/model/user.model.ts";
import { parseOrThrow } from "../../../shared/utils/parseOrThrow.ts";
import type {
  NotificationService,
  NotificationViewer,
} from "../services/notification.service.ts";
import {
  forceRetryQuerySchema,
  notificationIdParamSchema,
  paginationQuerySchema,
  userIdParamSchema,
  type CreateNotificationInput,
  type PreferencesInput,
} from "../schema/notification.schema.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const USER_ROLES: readonly UserRole[] = [
  "owner",
  "pharmacist",
  "inventory_manager",
];

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

function requireViewer(req: Request): NotificationViewer {
  const user = req.user;
  if (!user?.userId || !isUserRole(user.role)) {
    throw AppError.unauthorized("Authenticated user required");
  }
  return { userId: user.userId, role: user.role };
}

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // POST /notifications
  // Body is validated by the shared validate middleware before this handler.
  createNotification = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as CreateNotificationInput;
    const notification =
      await this.notificationService.createNotification(dto);

    res.status(201).json({ success: true, data: notification });
  });

  // POST /notifications/:id/dispatch?force=true
  dispatch = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(notificationIdParamSchema, req.params);
    const { force } = parseOrThrow(forceRetryQuerySchema, req.query);
    const notification = await this.notificationService.dispatch(id, {
      force: force === true,
    });
    res.status(200).json({ success: true, data: notification });
  });

  // POST /notifications/:id/retry
  retry = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(notificationIdParamSchema, req.params);
    const notification = await this.notificationService.dispatch(id, {
      force: true,
    });
    res.status(200).json({ success: true, data: notification });
  });

  // GET /notifications/:id
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(notificationIdParamSchema, req.params);
    const viewer = requireViewer(req);
    const notification = await this.notificationService.getById(id, viewer);
    res.status(200).json({ success: true, data: notification });
  });

  // GET /notifications
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const page = parseOrThrow(paginationQuerySchema, req.query);
    const notifications = await this.notificationService.getAll(page);
    res.status(200).json({ success: true, data: notifications });
  });

  // GET /notifications/me
  getForCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const viewer = requireViewer(req);
    const page = parseOrThrow(paginationQuerySchema, req.query);
    const notifications = await this.notificationService.getForUser(
      viewer.userId,
      viewer,
      page,
    );
    res.status(200).json({ success: true, data: notifications });
  });

  // GET /notifications/user/:userId
  getForUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = parseOrThrow(userIdParamSchema, req.params);
    const viewer = requireViewer(req);
    const page = parseOrThrow(paginationQuerySchema, req.query);
    const notifications = await this.notificationService.getForUser(
      userId,
      viewer,
      page,
    );
    res.status(200).json({ success: true, data: notifications });
  });

  // PATCH /notifications/me/:id/read
  markRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(notificationIdParamSchema, req.params);
    const viewer = requireViewer(req);
    const result = await this.notificationService.markRead(viewer.userId, id);
    res.status(200).json({ success: true, data: result });
  });

  // PATCH /notifications/me/read-all
  markAllRead = asyncHandler(async (req: Request, res: Response) => {
    const viewer = requireViewer(req);
    const result = await this.notificationService.markAllRead(viewer.userId);
    res.status(200).json({ success: true, data: result });
  });

  // GET /notifications/preferences/me
  getMyPreferences = asyncHandler(async (req: Request, res: Response) => {
    const viewer = requireViewer(req);
    const preferences = await this.notificationService.getPreferences(
      viewer.userId,
      viewer,
    );
    res.status(200).json({ success: true, data: preferences });
  });

  // PATCH /notifications/preferences/me
  updateMyPreferences = asyncHandler(async (req: Request, res: Response) => {
    const viewer = requireViewer(req);
    const patch = req.body as PreferencesInput;
    const preferences = await this.notificationService.updatePreferences(
      viewer.userId,
      viewer,
      patch,
    );
    res.status(200).json({ success: true, data: preferences });
  });

  // GET /notifications/preferences/:userId
  getPreferencesForUser = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = parseOrThrow(userIdParamSchema, req.params);
      const viewer = requireViewer(req);
      const preferences = await this.notificationService.getPreferences(
        userId,
        viewer,
      );
      res.status(200).json({ success: true, data: preferences });
    },
  );

  // PATCH /notifications/preferences/:userId
  updatePreferencesForUser = asyncHandler(
    async (req: Request, res: Response) => {
      const { userId } = parseOrThrow(userIdParamSchema, req.params);
      const viewer = requireViewer(req);
      const patch = req.body as PreferencesInput;
      const preferences = await this.notificationService.updatePreferences(
        userId,
        viewer,
        patch,
      );
      res.status(200).json({ success: true, data: preferences });
    },
  );

  // DELETE /notifications/:id
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = parseOrThrow(notificationIdParamSchema, req.params);
    await this.notificationService.delete(id);
    res.status(200).json({ success: true, message: "Notification deleted" });
  });
}
