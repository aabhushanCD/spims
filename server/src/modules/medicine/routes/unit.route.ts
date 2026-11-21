import express, { type NextFunction, type Request, type Response } from "express";
const router = express.Router();
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.js";
import { objectIdParamSchema } from "../../../shared/schema/objectId.schema.ts";
import { CreateUnitSchema, UpdateUnitSchema } from "../schema/unit.schema.js";
import { unitController } from "../../../app/container.ts";

router.post("/", validate(CreateUnitSchema), verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.createUnit(req, res, next);
});

router.get("/:id", verifyToken, validateParams(objectIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  unitController.getUnitById(req, res, next);
});
router.get("/", verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.getAllUnits(req, res, next);
});

router.put("/:id", validateParams(objectIdParamSchema), validate(UpdateUnitSchema), verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.updateUnit(req, res, next);
});
router.delete("/:id", verifyToken, validateParams(objectIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  unitController.deleteUnit(req, res, next);
});

export default router;
