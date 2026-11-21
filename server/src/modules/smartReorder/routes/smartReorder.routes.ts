// smartReorder.routes.ts
import { Router } from "express";

import { authorize } from "../../../shared/middleware/authorize.ts";
import { validateParams } from "../../../shared/middleware/validate.middleware.ts";
import { smartReorderController } from "../../../app/container.ts";
import {
  smartReorderIdParamSchema,
  smartReorderMedicineParamSchema,
} from "../schema/smartReorder.schema.ts";

const router = Router();

router.get("/pending", smartReorderController.getPending);
router.get(
  "/medicine/:medicineId",
  validateParams(smartReorderMedicineParamSchema),
  smartReorderController.getByMedicineId,
);
router.get("/", smartReorderController.getAll);
router.get(
  "/:id",
  validateParams(smartReorderIdParamSchema),
  smartReorderController.getById,
);

router.patch(
  "/:id/approve",
  validateParams(smartReorderIdParamSchema),
  smartReorderController.approve,
);
router.patch(
  "/:id/reject",
  validateParams(smartReorderIdParamSchema),
  smartReorderController.reject,
);

router.post(
  "/generate",
  authorize(["owner", "inventory_manager"]),
  smartReorderController.generateAll,
);
router.post(
  "/generate/:medicineId",
  authorize(["owner", "inventory_manager"]),
  validateParams(smartReorderMedicineParamSchema),
  smartReorderController.generateForMedicine,
);
router.delete(
  "/:id",
  authorize(["owner"]),
  validateParams(smartReorderIdParamSchema),
  smartReorderController.delete,
);

export default router;
