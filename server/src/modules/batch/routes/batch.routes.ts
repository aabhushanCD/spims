// batch.routes.ts
import { Router } from "express";
import { medicineBatchController } from "../../../app/container.ts";
// adjust to your actual module file

const router = Router();

// Static/specific routes first, dynamic :id routes after
router.get("/expired", medicineBatchController.getExpiredBatches);
router.get("/low-stock", medicineBatchController.getLowStockBatches);
router.post("/mark-expired", medicineBatchController.markExpiredBatches);

router.get(
  "/medicine/:medicineId/available",
  medicineBatchController.getAvailableBatches,
);
router.get("/medicine/:medicineId/allocate", medicineBatchController.allocateStock);

router.post("/", medicineBatchController.createBatch);
router.get("/", medicineBatchController.getAllBatches);

router.get("/:id", medicineBatchController.getBatchById);
router.patch("/:id", medicineBatchController.updateBatch);
router.delete("/:id", medicineBatchController.deleteBatch);

router.post("/:id/deduct", medicineBatchController.deductQuantity);
router.post("/:id/increase", medicineBatchController.increaseQuantity);
router.post("/:id/adjust", medicineBatchController.adjustStock);
router.get("/:id/history", medicineBatchController.getBatchHistory);

export default router;
