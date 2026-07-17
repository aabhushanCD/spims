// sales.routes.ts
import { Router, type Request, type Response } from "express";
import type { SalesController } from "../controller/sales.controller.ts";
import { validate } from "../../../shared/middleware/validate.middleware.ts";
import { createSaleSchema, createSalesItemSchema } from "../schema/sales.schema.ts";
import { saleController } from "../../../app/container.ts";

const router = Router();

router.post(
  "/",
  validate(createSaleSchema),
  (req: Request, res: Response) => saleController.createSale(req, res),
);

router.get("/", (req: Request, res: Response) =>
  saleController.getAllSales(req, res),
);

router.get("/:id", (req: Request, res: Response) =>
  saleController.getSaleById(req, res),
);

router.patch("/:id", (req: Request, res: Response) =>
  saleController.updateSale(req, res),
);

router.delete("/:id", (req: Request, res: Response) =>
  saleController.deleteSale(req, res),
);

export default router;
