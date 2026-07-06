// batch.routes.ts
import { Router } from "express";
import { batchController } from "../batch.module.ts";
// adjust to your actual module file

const router = Router();

// Static/specific routes first, dynamic :id routes after
router.get("/expired", batchController.getExpiredBatches);
router.get("/low-stock", batchController.getLowStockBatches);
router.post("/mark-expired", batchController.markExpiredBatches);

router.get(
  "/medicine/:medicineId/available",
  batchController.getAvailableBatches,
);
router.get("/medicine/:medicineId/allocate", batchController.allocateStock);

router.post("/", batchController.createBatch);
router.get("/", batchController.getAllBatches);

router.get("/:id", batchController.getBatchById);
router.patch("/:id", batchController.updateBatch);
router.delete("/:id", batchController.deleteBatch);

router.post("/:id/deduct", batchController.deductQuantity);
router.post("/:id/increase", batchController.increaseQuantity);
router.post("/:id/adjust", batchController.adjustStock);
router.get("/:id/history", batchController.getBatchHistory);

export default router;
