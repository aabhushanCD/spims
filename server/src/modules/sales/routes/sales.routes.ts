// sales.routes.ts
import { Router, type NextFunction, type Request, type Response } from "express";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createSaleSchema,
  saleIdParamSchema,
  salesListQuerySchema,
  updateSaleSchema,
} from "../schema/sales.schema.ts";
import { paymentController, saleController } from "../../../app/container.ts";
import { createPaymentSchema } from "../../payment/schema/payment.schema.ts";

const router = Router();

router.post(
  "/",
  validate(createSaleSchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.createSale(req, res, next),
);

router.get(
  "/",
  validateQuery(salesListQuerySchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.getAllSales(req, res, next),
);

router.get(
  "/:id/invoice",
  validateParams(saleIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.getInvoice(req, res, next),
);

router.get(
  "/:id/payments",
  validateParams(saleIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    paymentController.getForSale(req, res, next),
);
router.post(
  "/:id/payments",
  validateParams(saleIdParamSchema),
  validate(createPaymentSchema),
  (req: Request, res: Response, next: NextFunction) =>
    paymentController.addPayment(req, res, next),
);

router.get(
  "/:id",
  validateParams(saleIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.getSaleById(req, res, next),
);

router.patch(
  "/:id",
  validateParams(saleIdParamSchema),
  validate(updateSaleSchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.updateSale(req, res, next),
);

router.delete(
  "/:id",
  validateParams(saleIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    saleController.deleteSale(req, res, next),
);

export default router;
