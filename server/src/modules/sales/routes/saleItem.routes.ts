// saleItem.routes.ts
import { Router } from "express";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import type { SaleItemController } from "../controller/salesItem.controller.ts";
import {
  saleItemIdParamSchema,
  saleItemSalesParamSchema,
  updateSaleItemSchema,
} from "../schema/sales.schema.ts";

export function buildSaleItemRouter(controller: SaleItemController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get(
    "/sales/:salesId",
    validateParams(saleItemSalesParamSchema),
    controller.getBySalesId,
  );
  router.get(
    "/:id",
    validateParams(saleItemIdParamSchema),
    controller.getById,
  );
  router.patch(
    "/:id",
    validateParams(saleItemIdParamSchema),
    validate(updateSaleItemSchema),
    controller.update,
  );
  // No POST/DELETE exposed — items are created/removed only via SalesService

  return router;
}
