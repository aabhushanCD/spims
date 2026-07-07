import express from "express";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import {
  createMedicineSchema,
  updateMedicineSchema,
} from "../schema/medicine.schema.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { medicineController } from "../../../app/container.ts";

const router = express.Router();

router.post("/", validate(createMedicineSchema), (req, res) => {
  medicineController.createMedicine(req, res);
});

router.get("/:id", (req, res) => {
  medicineController.getMedicineById(req, res);
});

router.get("/", (req, res) => {
  medicineController.getAllMedicines(req, res);
});

router.put("/:id", validate(updateMedicineSchema), (req, res) => {
  medicineController.updateMedicine(req, res);
});

router.delete("/:id", (req, res) => {
  medicineController.deactivateMedicine(req, res);
});

export default router;
