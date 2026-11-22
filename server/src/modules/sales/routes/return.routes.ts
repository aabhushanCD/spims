// return.routes.ts
import { Router } from "express";
import { authorize } from "../../../shared/middleware/authorize.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import type { ReturnController } from "../controller/return.controller.ts";
import {
  CreateReturnSchema,
  ReturnListQuerySchema,
  ReverseReturnSchema,
  UpdateReturnSchema,
  returnIdParamSchema,
} from "../schema/return.schema.ts";

export function buildReturnRouter(controller: ReturnController): Router {
  const router = Router();

  router.post("/", validate(CreateReturnSchema), controller.createReturn);
  router.get(
    "/",
    validateQuery(ReturnListQuerySchema),
    controller.getAllReturns,
  );

  // Status transitions. Static action paths are registered before /:id.
  router.patch(
    "/:id/approve",
    validateParams(returnIdParamSchema),
    authorize(["owner", "inventory_manager"]),
    controller.approveReturn,
  );
  router.patch(
    "/:id/reject",
    validateParams(returnIdParamSchema),
    authorize(["owner", "inventory_manager"]),
    controller.rejectReturn,
  );
  router.patch(
    "/:id/cancel",
    validateParams(returnIdParamSchema),
    controller.cancelReturn,
  );
  router.patch(
    "/:id/complete",
    validateParams(returnIdParamSchema),
    controller.completeReturn,
  );
  router.patch(
    "/:id/reverse",
    validateParams(returnIdParamSchema),
    validate(ReverseReturnSchema),
    authorize(["owner", "inventory_manager"]),
    controller.reverseReturn,
  );

  router.get(
    "/:id",
    validateParams(returnIdParamSchema),
    controller.getReturnById,
  );
  router.patch(
    "/:id",
    validateParams(returnIdParamSchema),
    validate(UpdateReturnSchema),
    controller.updateReturn,
  );
  // No DELETE — reversing a completed return needs its own stock-reversal logic.

  return router;
}
