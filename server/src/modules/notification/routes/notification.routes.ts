// notification.routes.ts
import { Router } from "express";
import { notificationController } from "../../../app/container.ts";
import { authorize } from "../../../shared/middleware/authorize.ts";
import { validate } from "../../../shared/middleware/validate.middleware.ts";
import {
  createNotificationSchema,
  preferencesSchema,
} from "../schema/notification.schema.ts";

const router = Router();

router.get("/me", notificationController.getForCurrentUser);
router.patch("/me/read-all", notificationController.markAllRead);
router.patch("/me/:id/read", notificationController.markRead);

router.get("/preferences/me", notificationController.getMyPreferences);
router.patch(
  "/preferences/me",
  validate(preferencesSchema),
  notificationController.updateMyPreferences,
);
router.get(
  "/preferences/:userId",
  notificationController.getPreferencesForUser,
);
router.patch(
  "/preferences/:userId",
  validate(preferencesSchema),
  notificationController.updatePreferencesForUser,
);

router.get("/user/:userId", notificationController.getForUser);

router.post(
  "/",
  validate(createNotificationSchema),
  notificationController.createNotification,
);
router.get("/", notificationController.getAll);
router.get(
  "/:id",
  authorize(["owner", "pharmacist"]),
  notificationController.getById,
);

router.post(
  "/:id/dispatch",
  authorize(["owner", "pharmacist"]),
  notificationController.dispatch,
);
router.post(
  "/:id/retry",
  authorize(["owner", "pharmacist"]),
  notificationController.retry,
);
router.delete("/:id", notificationController.delete);

export default router;
