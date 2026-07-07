import express from "express";

const router = express.Router();
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { CreateUnitSchema, UpdateUnitSchema } from "../schema/unit.schema.js";
import { unitController } from "../../../app/container.ts";

router.post("/", validate(CreateUnitSchema), verifyToken, (req, res) => {
  unitController.createUnit(req, res);
});

router.get("/:id", verifyToken, (req, res) => {
  unitController.getUnitById(req, res);
});
router.get("/", verifyToken, (req, res) => {
  unitController.getAllUnits(req, res);
});

router.put("/:id", validate(UpdateUnitSchema), verifyToken, (req, res) => {
  unitController.updateUnit(req, res);
});
router.delete("/:id", verifyToken, (req, res) => {
  unitController.deleteUnit(req, res);
});

export default router;
