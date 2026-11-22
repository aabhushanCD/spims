import { Router } from "express";
import { inventoryController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createInventorySchema,
  decreaseStockSchema,
  deleteInventorySchema,
  increaseStockSchema,
  inventoryIdParamSchema,
  inventoryListQuerySchema,
  inventoryMedicineParamSchema,
  inventorySearchQuerySchema,
  releaseStockSchema,
  reserveStockSchema,
  syncInventorySchema,
  updateInventorySchema,
} from "../schema/inventory.schema.ts";
import { inventoryMovementListQuerySchema } from "../schema/inventoryMovement.schema.ts";

const router = Router();

router.post(
  "/",
  validate(createInventorySchema),
  inventoryController.createInventory,
);

router.get(
  "/reconciliation",
  inventoryController.getReconciliationReport,
);
router.get(
  "/medicines/search",
  validateQuery(inventorySearchQuerySchema),
  inventoryController.searchMedicines,
);
router.get(
  "/medicine/:medicineId",
  validateParams(inventoryMedicineParamSchema),
  inventoryController.getInventoryByMedicineId,
);

router.get(
  "/movements",
  validateQuery(inventoryMovementListQuerySchema),
  inventoryController.getMovements,
);
router.get(
  "/movements/:id",
  validateParams(inventoryIdParamSchema),
  inventoryController.getMovementById,
);

router.get(
  "/:id",
  validateParams(inventoryIdParamSchema),
  inventoryController.getInventoryById,
);

router.post(
  "/:medicineId/increase",
  validateParams(inventoryMedicineParamSchema),
  validate(increaseStockSchema),
  inventoryController.increaseStock,
);
router.post(
  "/:medicineId/decrease",
  validateParams(inventoryMedicineParamSchema),
  validate(decreaseStockSchema),
  inventoryController.decreaseStock,
);
router.post(
  "/:medicineId/reserve",
  validateParams(inventoryMedicineParamSchema),
  validate(reserveStockSchema),
  inventoryController.reserveStock,
);
router.post(
  "/:medicineId/release",
  validateParams(inventoryMedicineParamSchema),
  validate(releaseStockSchema),
  inventoryController.releaseReservedStock,
);
router.post(
  "/:medicineId/sync",
  validateParams(inventoryMedicineParamSchema),
  validate(syncInventorySchema),
  inventoryController.syncInventoryFromBatch,
);

router.patch(
  "/:id",
  validateParams(inventoryIdParamSchema),
  validate(updateInventorySchema),
  inventoryController.updateInventory,
);
router.delete(
  "/:id",
  validateParams(inventoryIdParamSchema),
  validate(deleteInventorySchema),
  inventoryController.deleteInventory,
);
router.get(
  "/",
  validateQuery(inventoryListQuerySchema),
  inventoryController.getAllInventories,
);
export default router;
