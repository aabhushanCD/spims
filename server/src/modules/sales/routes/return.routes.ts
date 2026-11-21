// return.routes.ts
import { Router } from "express";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import type { ReturnController } from "../controller/return.controller.ts";
import {
  CreateReturnSchema,
  UpdateReturnSchema,
  returnIdParamSchema,
} from "../schema/return.schema.ts";

export function buildReturnRouter(controller: ReturnController): Router {
  const router = Router();

  router.post("/", validate(CreateReturnSchema), controller.createReturn);
  router.get("/", controller.getAllReturns);
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
  // No DELETE — reversing a return would need its own stock-reversal logic, not implemented

  return router;
}
