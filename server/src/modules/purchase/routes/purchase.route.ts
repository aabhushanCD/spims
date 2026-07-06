import { Router, type Request, type Response } from "express";
import {
  createPurchaseOrderItemSchema,
  updatePurchaseOrderItemSchema,
} from "../schema/purchaseOrderItem.schema.js";
import { createPurchaseOrderSchema } from "../schema/purchaseOrder.schema.ts";
import { purchaseOrderController } from "../purchase.module.ts";
import { validate } from "../../../shared/middleware/validate.middleware.ts";
import { authorize } from "../../../shared/middleware/authorize.ts";
import { verifyToken } from "../../../shared/middleware/verifyToken.ts";

const router = Router();

// Apply authentication to all purchase routes
router.use(authorize);
router.use((req: Request, res: Response, next) => {
  verifyToken(req, res, next);
});
/* -------------------------------------------------------------------------- */
/*                              Purchase Orders                               */
/* -------------------------------------------------------------------------- */

// Create Purchase Order
router.post(
  "/",
  validate(createPurchaseOrderSchema),
  (req: Request, res: Response) =>
    purchaseOrderController.createPurchaseOrder(req, res),
);

// Get All Purchase Orders
router.get("/", (req: Request, res: Response) =>
  purchaseOrderController.getPurchaseOrders(req, res),
);

// Get Purchase Order By Id
router.get("/:id", (req: Request, res: Response) =>
  purchaseOrderController.getPurchaseOrderById(req, res),
);

// Delete Purchase Order
router.delete("/:id", (req: Request, res: Response) =>
  purchaseOrderController.deletePurchaseOrder(req, res),
);

// Cancel Purchase Order
router.patch("/:id/cancel", (req: Request, res: Response) =>
  purchaseOrderController.cancelPurchaseOrder(req, res),
);

// Approve Purchase Order
router.patch("/:id/approve", (req: Request, res: Response) =>
  purchaseOrderController.approvePurchaseOrder(req, res),
);

// Receive Purchase Order
router.patch("/:id/receive", (req: Request, res: Response) =>
  purchaseOrderController.receivePurchaseOrder(req, res),
);

// Update Purchase Order (if you allow updating)
// router.patch("/:id", (req: Request, res: Response) =>
//   purchaseOrderController.updatePurchaseOrder(req, res),
// );

// Recalculate Total
router.patch("/:id/recalculate", (req: Request, res: Response) =>
  purchaseOrderController.recalculateTotals(req, res),
);

/* -------------------------------------------------------------------------- */
/*                           Purchase Order Items                             */
/* -------------------------------------------------------------------------- */

// Get all items of a purchase order
router.get("/:id/items", (req: Request, res: Response) =>
  purchaseOrderController.getPurchaseOrderItems(req, res),
);

// Add item
router.post(
  "/:id/items",
  validate(createPurchaseOrderItemSchema),
  (req: Request, res: Response) =>
    purchaseOrderController.addPurchaseOrderItem(req, res),
);

// Update item
router.patch(
  "/:id/items/:itemId",
  validate(updatePurchaseOrderItemSchema),
  (req: Request, res: Response) =>
    purchaseOrderController.updatePurchaseOrderItem(req, res),
);

// Delete item
router.delete("/:id/items/:itemId", (req: Request, res: Response) =>
  purchaseOrderController.removePurchaseOrderItem(req, res),
);

/* -------------------------------------------------------------------------- */
/*                                 Supplier                                   */
/* -------------------------------------------------------------------------- */

// Purchase orders by supplier
router.get("/supplier/:supplierId", (req: Request, res: Response) =>
  purchaseOrderController.getPurchaseOrdersBySupplierId(req, res),
);

export default router;
