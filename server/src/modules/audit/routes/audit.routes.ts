import { Router } from "express";

import { auditController } from "../../../app/container.ts";
import { validateQuery } from "../../../shared/middleware/validate.middleware.ts";
import { auditQuerySchema } from "../schema/audit.schema.ts";

const router = Router();

router.get(
  "/",
  validateQuery(auditQuerySchema),
  (req, res, next) => auditController.getLogs(req, res, next),
);

export default router;
