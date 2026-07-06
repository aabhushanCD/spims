// smartReorder.routes.ts
import { Router } from "express";
import { smartReorderController } from "../smartReorder.module.ts";
import { authorize } from "../../../shared/middleware/authorize.ts";
const router = Router();

router.get("/pending", smartReorderController.getPending);
router.get("/medicine/:medicineId", smartReorderController.getByMedicineId);
router.get("/", smartReorderController.getAll);
router.get("/:id", smartReorderController.getById);

router.patch("/:id/approve", smartReorderController.approve);
router.patch("/:id/reject", smartReorderController.reject);

router.post(
  "/generate",
  authorize(["owner", "inventory_manager"]),
  smartReorderController.generateAll,
);
router.post(
  "/generate/:medicineId",
  authorize(["owner", "inventory_manager"]),
  smartReorderController.generateForMedicine,
);
router.delete("/:id", authorize(["owner"]), smartReorderController.delete);

export default router;
