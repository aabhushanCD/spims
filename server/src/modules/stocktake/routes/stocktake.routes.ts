import { Router } from "express";

import { stocktakeController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createStocktakeSchema,
  stocktakeIdParamSchema,
  stocktakeListQuerySchema,
  updateStocktakeSchema,
} from "../schema/stocktake.schema.ts";

const router = Router();

router.post(
  "/",
  validate(createStocktakeSchema),
  (req, res, next) => stocktakeController.create(req, res, next),
);
router.get(
  "/",
  validateQuery(stocktakeListQuerySchema),
  (req, res, next) => stocktakeController.getAll(req, res, next),
);
router.get(
  "/:id",
  validateParams(stocktakeIdParamSchema),
  (req, res, next) => stocktakeController.getById(req, res, next),
);
router.patch(
  "/:id",
  validateParams(stocktakeIdParamSchema),
  validate(updateStocktakeSchema),
  (req, res, next) => stocktakeController.update(req, res, next),
);
router.post(
  "/:id/complete",
  validateParams(stocktakeIdParamSchema),
  (req, res, next) => stocktakeController.complete(req, res, next),
);
router.post(
  "/:id/cancel",
  validateParams(stocktakeIdParamSchema),
  (req, res, next) => stocktakeController.cancel(req, res, next),
);

export default router;
