// smartReorder.routes.ts
import { Router } from "express";

import { authorize } from "../../../shared/middleware/authorize.ts";
import {
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import { smartReorderController } from "../../../app/container.ts";
import {
  createSmartReorderSchema,
  rejectSmartReorderSchema,
  smartReorderIdParamSchema,
  smartReorderListQuerySchema,
  smartReorderMedicineParamSchema,
} from "../schema/smartReorder.schema.ts";
import { validate } from "../../../shared/middleware/validate.middleware.ts";

const router = Router();

router.get("/pending", smartReorderController.getPending);
router.get(
  "/medicine/:medicineId",
  validateParams(smartReorderMedicineParamSchema),
  smartReorderController.getByMedicineId,
);
router.post(
  "/",
  authorize(["owner", "inventory_manager"]),
  validate(createSmartReorderSchema),
  smartReorderController.create,
);
router.get(
  "/",
  validateQuery(smartReorderListQuerySchema),
  smartReorderController.getAll,
);
router.get(
  "/:id",
  validateParams(smartReorderIdParamSchema),
  smartReorderController.getById,
);

router.patch(
  "/:id/approve",
  authorize(["owner", "inventory_manager"]),
  validateParams(smartReorderIdParamSchema),
  smartReorderController.approve,
);
router.patch(
  "/:id/reject",
  authorize(["owner", "inventory_manager"]),
  validateParams(smartReorderIdParamSchema),
  validate(rejectSmartReorderSchema),
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
