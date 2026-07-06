// sales.routes.ts
import { Router } from "express";
import type { SalesController } from "../controller/sales.controller.ts";

export function buildSalesRouter(controller: SalesController): Router {
  const router = Router();

  router.post("/", controller.createSale);
  router.get("/", controller.getAllSales);
  router.get("/:id", controller.getSaleById);
  router.patch("/:id", controller.updateSale);
  router.delete("/:id", controller.deleteSale);

  return router;
}
