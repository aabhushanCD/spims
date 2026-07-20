// sales.routes.ts
import { Router, type NextFunction, type Request, type Response } from "express";
import type { SalesController } from "../controller/sales.controller.ts";
import { validate } from "../../../shared/middleware/validate.middleware.ts";
import { createSaleSchema, createSalesItemSchema } from "../schema/sales.schema.ts";
import { saleController } from "../../../app/container.ts";

const router = Router();

router.post(
  "/",
  validate(createSaleSchema),
  (req: Request, res: Response, next: NextFunction) => saleController.createSale(req, res, next),
);

router.get("/", (req: Request, res: Response, next: NextFunction) =>
  saleController.getAllSales(req, res, next),
);

router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  saleController.getSaleById(req, res, next),
);

router.patch("/:id", (req: Request, res: Response, next: NextFunction) =>
  saleController.updateSale(req, res, next),
);

router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  saleController.deleteSale(req, res, next),
);

export default router;
