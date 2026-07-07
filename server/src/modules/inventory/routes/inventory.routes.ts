// inventory.routes.ts
import { Router } from "express";
import { inventoryController } from "../../../app/container.ts";

const router = Router();

router.post("/", inventoryController.createInventory);
router.get(
  "/medicine/:medicineId",
  inventoryController.getInventoryByMedicineId,
);
router.get("/:id", inventoryController.getInventoryById);

router.post("/:medicineId/increase", inventoryController.increaseStock);
router.post("/:medicineId/decrease", inventoryController.decreaseStock);
router.post("/:medicineId/reserve", inventoryController.reserveStock);
router.post("/:medicineId/release", inventoryController.releaseReservedStock);
router.post("/:medicineId/sync", inventoryController.syncInventoryFromBatch);

router.patch("/:id", inventoryController.updateInventory);
router.delete("/:id", inventoryController.deleteInventory);

export default router;
