import { Router } from "express";

import { purchaseReturnController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createPurchaseReturnSchema,
  purchaseReturnIdParamSchema,
  purchaseReturnListQuerySchema,
  purchaseReturnSupplierParamSchema,
} from "../schema/purchaseReturn.schema.ts";

const router = Router();

router.post(
  "/",
  validate(createPurchaseReturnSchema),
  (req, res, next) => purchaseReturnController.create(req, res, next),
);
router.get(
  "/",
  validateQuery(purchaseReturnListQuerySchema),
  (req, res, next) => purchaseReturnController.getAll(req, res, next),
);
router.get(
  "/suppliers/:supplierId/ledger",
  validateParams(purchaseReturnSupplierParamSchema),
  (req, res, next) =>
    purchaseReturnController.getSupplierLedger(req, res, next),
);
router.get(
  "/:id",
  validateParams(purchaseReturnIdParamSchema),
  (req, res, next) => purchaseReturnController.getById(req, res, next),
);
router.patch(
  "/:id/approve",
  validateParams(purchaseReturnIdParamSchema),
  (req, res, next) => purchaseReturnController.approve(req, res, next),
);
router.patch(
  "/:id/reject",
  validateParams(purchaseReturnIdParamSchema),
  (req, res, next) => purchaseReturnController.reject(req, res, next),
);
router.patch(
  "/:id/cancel",
  validateParams(purchaseReturnIdParamSchema),
  (req, res, next) => purchaseReturnController.cancel(req, res, next),
);
router.patch(
  "/:id/complete",
  validateParams(purchaseReturnIdParamSchema),
  (req, res, next) => purchaseReturnController.complete(req, res, next),
);

export default router;
