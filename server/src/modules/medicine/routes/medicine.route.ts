import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  createMedicineSchema,
  medicineListQuerySchema,
  medicineSearchQuerySchema,
  updateMedicineSchema,
} from "../schema/medicine.schema.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.js";
import { objectIdParamSchema } from "../../../shared/schema/objectId.schema.ts";
import { medicineController } from "../../../app/container.ts";

const router = express.Router();

router.post(
  "/",
  validate(createMedicineSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.createMedicine(req, res, next);
  },
);
router.get(
  "/",
  validateQuery(medicineListQuerySchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.getAllMedicines(req, res, next);
  },
);

router.get(
  "/search",
  validateQuery(medicineSearchQuerySchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.searchMedicines(req, res, next);
  },
);

router.get(
  "/:id",
  validateParams(objectIdParamSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.getMedicineById(req, res, next);
  },
);

router.put(
  "/:id",
  validateParams(objectIdParamSchema),
  validate(updateMedicineSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.updateMedicine(req, res, next);
  },
);

router.delete(
  "/:id",
  validateParams(objectIdParamSchema),
  (req: Request, res: Response, next: NextFunction) => {
    medicineController.deactivateMedicine(req, res, next);
  },
);

export default router;
