import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  createPurchaseOrderItemSchema,
  updatePurchaseOrderItemSchema,
} from "../schema/purchaseOrderItem.schema.js";
import {
  createPurchaseOrderSchema,
  purchaseIdParamSchema,
  purchaseItemParamSchema,
  purchaseSupplierParamSchema,
} from "../schema/purchaseOrder.schema.ts";
import { receivePurchaseOrderSchema } from "../schema/receivePurchaseOrder.schema.ts";

import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import { verifyToken } from "../../../shared/middleware/verifyToken.ts";
import { purchaseOrderController } from "../../../app/container.ts";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => {
  verifyToken(req, res, next);
});
/* -------------------------------------------------------------------------- */
/*                              Purchase Orders                               */
/* -------------------------------------------------------------------------- */

// Create Purchase Order
router.post(
  "/",
  validate(createPurchaseOrderSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.createPurchaseOrder(req, res, next),
);

// Get All Purchase Orders
router.get("/", (req: Request, res: Response, next: NextFunction) =>
  purchaseOrderController.getPurchaseOrders(req, res, next),
);

// Get Purchase Order By Id
router.get(
  "/:id",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.getPurchaseOrderById(req, res, next),
);

// Delete Purchase Order
router.delete(
  "/:id",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.deletePurchaseOrder(req, res, next),
);

// Cancel Purchase Order
router.patch(
  "/:id/cancel",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.cancelPurchaseOrder(req, res, next),
);

// Approve Purchase Order
router.patch(
  "/:id/approve",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.approvePurchaseOrder(req, res, next),
);

// Receive Purchase Order
router.post(
  "/:id/receive",
  validateParams(purchaseIdParamSchema),
  validate(receivePurchaseOrderSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.receivePurchaseOrder(req, res, next),
);

// Recalculate Total
router.patch(
  "/:id/recalculate",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.recalculateTotals(req, res, next),
);

/* -------------------------------------------------------------------------- */
/*                           Purchase Order Items                             */
/* -------------------------------------------------------------------------- */

// Get all items of a purchase order
router.get(
  "/:id/items",
  validateParams(purchaseIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.getPurchaseOrderItems(req, res, next),
);

// Add item
router.post(
  "/:id/items",
  validateParams(purchaseIdParamSchema),
  validate(createPurchaseOrderItemSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.addPurchaseOrderItem(req, res, next),
);

// Update item
router.patch(
  "/:id/items/:itemId",
  validateParams(purchaseItemParamSchema),
  validate(updatePurchaseOrderItemSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.updatePurchaseOrderItem(req, res, next),
);

// Delete item
router.delete(
  "/:id/items/:itemId",
  validateParams(purchaseItemParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.removePurchaseOrderItem(req, res, next),
);

/* -------------------------------------------------------------------------- */
/*                                 Supplier                                   */
/* -------------------------------------------------------------------------- */

// Purchase orders by supplier
router.get(
  "/supplier/:supplierId",
  validateParams(purchaseSupplierParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    purchaseOrderController.getPurchaseOrdersBySupplierId(req, res, next),
);

export default router;
