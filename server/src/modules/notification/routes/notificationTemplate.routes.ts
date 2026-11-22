import { Router } from "express";

import { notificationTemplateController } from "../../../app/container.ts";
import { authorize } from "../../../shared/middleware/authorize.ts";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createNotificationTemplateSchema,
  notificationTemplateIdParamSchema,
  renderNotificationTemplateSchema,
  updateNotificationTemplateSchema,
} from "../schema/notificationTemplate.schema.ts";

const router = Router();

router.post(
  "/",
  authorize(["owner"]),
  validate(createNotificationTemplateSchema),
  (req, res, next) => notificationTemplateController.create(req, res, next),
);
router.get("/", (req, res, next) =>
  notificationTemplateController.getAll(req, res, next),
);
router.get(
  "/:id",
  validateParams(notificationTemplateIdParamSchema),
  (req, res, next) => notificationTemplateController.getById(req, res, next),
);
router.put(
  "/:id",
  authorize(["owner"]),
  validateParams(notificationTemplateIdParamSchema),
  validate(updateNotificationTemplateSchema),
  (req, res, next) => notificationTemplateController.update(req, res, next),
);
router.delete(
  "/:id",
  authorize(["owner"]),
  validateParams(notificationTemplateIdParamSchema),
  (req, res, next) => notificationTemplateController.delete(req, res, next),
);
router.post(
  "/:id/render",
  validateParams(notificationTemplateIdParamSchema),
  validate(renderNotificationTemplateSchema),
  (req, res, next) => notificationTemplateController.render(req, res, next),
);

export default router;
