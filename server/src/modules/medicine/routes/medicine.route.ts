import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
} from "../schema/medicine.schema.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { medicineController } from "../../../app/container.ts";

const router = express.Router();

router.post(
  "/",
  validate(createMedicineSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.createMedicine(req, res, next);
  },
);
router.get("/", (req: Request, res: Response, next: NextFunction) => {
  medicineController.getAllMedicines(req, res, next);
});

router.get("/search", (req: Request, res: Response, next: NextFunction) => {
  medicineController.searchMedicines(req, res, next);
});

router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
  medicineController.getMedicineById(req, res, next);
});

router.put(
  "/:id",
  validate(updateMedicineSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.updateMedicine(req, res, next);
  },
);

router.delete("/:id", (req: Request, res: Response, next: NextFunction) => {
  medicineController.deactivateMedicine(req, res, next);
});

export default router;
