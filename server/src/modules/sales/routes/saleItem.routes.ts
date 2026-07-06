// saleItem.routes.ts
import { Router } from "express";
import type { SaleItemController } from "../controller/salesItem.controller.ts";

export function buildSaleItemRouter(controller: SaleItemController): Router {
  const router = Router();

  router.get("/", controller.getAll);
  router.get("/sales/:salesId", controller.getBySalesId);
  router.get("/:id", controller.getById);
  router.patch("/:id", controller.update);
  // No POST/DELETE exposed — items are created/removed only via SalesService

  return router;
}

