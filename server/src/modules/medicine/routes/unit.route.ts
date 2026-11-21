import express, { type NextFunction, type Request, type Response } from "express";
const router = express.Router();
import {
  createRateLimiter,
} from "../../../shared/middleware/rateLimit.middleware.ts";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.js";
import { objectIdParamSchema } from "../../../shared/schema/objectId.schema.ts";
import { CreateUnitSchema, UpdateUnitSchema } from "../schema/unit.schema.js";
import { unitController } from "../../../app/container.ts";

const unitRateLimiter = createRateLimiter({
  prefix: "medicine:unit",
  windowMs: 15 * 60_000,
  max: 300,
  message: "Too many unit requests. Please try again later.",
});

router.post("/", unitRateLimiter, validate(CreateUnitSchema), verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.createUnit(req, res, next);
});

router.get("/:id", unitRateLimiter, verifyToken, validateParams(objectIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  unitController.getUnitById(req, res, next);
});
router.get("/", unitRateLimiter, verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.getAllUnits(req, res, next);
});

router.put("/:id", unitRateLimiter, validateParams(objectIdParamSchema), validate(UpdateUnitSchema), verifyToken, (req: Request, res: Response, next: NextFunction) => {
  unitController.updateUnit(req, res, next);
});
router.delete("/:id", unitRateLimiter, verifyToken, validateParams(objectIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  unitController.deleteUnit(req, res, next);
});

export default router;
