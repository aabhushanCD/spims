import { Router } from "express";

import { medicineBatchController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  batchAdjustSchema,
  batchIdParamSchema,
  batchListQuerySchema,
  batchMedicineParamSchema,
  batchQuantitySchema,
  confirmDisposalSchema,
  createBatchSchema,
  lowStockQuerySchema,
  updateBatchSchema,
} from "../schema/batch.schema.ts";

const router = Router();

// Static/specific routes first, dynamic :id routes after
router.get("/expired", medicineBatchController.getExpiredBatches);
router.get(
  "/low-stock",
  validateQuery(lowStockQuerySchema),
  medicineBatchController.getLowStockBatches,
);
router.post("/mark-expired", medicineBatchController.markExpiredBatches);

router.get(
  "/medicine/:medicineId",
  validateParams(batchMedicineParamSchema),
  medicineBatchController.getBatchByMedicineId,
);
router.get(
  "/medicine/:medicineId/available",
  validateParams(batchMedicineParamSchema),
  medicineBatchController.getAvailableBatches,
);

router.get(
  "/expired/awaiting-disposal",
  medicineBatchController.getExpiredAwaitingDisposal,
);
router.post(
  "/",
  validate(createBatchSchema),
  medicineBatchController.createBatch,
);
router.get(
  "/",
  validateQuery(batchListQuerySchema),
  medicineBatchController.getAllBatches,
);

router.get(
  "/:id",
  validateParams(batchIdParamSchema),
  medicineBatchController.getBatchById,
);

router.patch(
  "/:id",
  validateParams(batchIdParamSchema),
  validate(updateBatchSchema),
  medicineBatchController.updateBatch,
);
router.delete(
  "/:id",
  validateParams(batchIdParamSchema),
  medicineBatchController.deleteBatch,
);

router.post(
  "/:id/deduct",
  validateParams(batchIdParamSchema),
  validate(batchQuantitySchema),
  medicineBatchController.deductQuantity,
);
router.post(
  "/:id/increase",
  validateParams(batchIdParamSchema),
  validate(batchQuantitySchema),
  medicineBatchController.increaseQuantity,
);
router.post(
  "/:id/adjust",
  validateParams(batchIdParamSchema),
  validate(batchAdjustSchema),
  medicineBatchController.adjustStock,
);
router.get(
  "/:id/history",
  validateParams(batchIdParamSchema),
  medicineBatchController.getBatchHistory,
);
router.post(
  "/:id/confirm-disposal",
  validateParams(batchIdParamSchema),
  validate(confirmDisposalSchema),
  medicineBatchController.confirmDisposal,
);
export default router;
