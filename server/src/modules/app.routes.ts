import express from "express";

import authRoutes from "./auth/routes/auth.route.js";
import userRoutes from "./user/routes/user.route.js";

import medicineRoutes from "./medicine/routes/medicine.route.js";
import unitRoutes from "./medicine/routes/unit.route.js";
import categoryRoutes from "./medicine/routes/category.route.js";
import brandRoutes from "./medicine/routes/brand.route.js";
import genericNameRoutes from "./medicine/routes/genericName.route.js";
import { authorize } from "../shared/middleware/authorize.js";
import { verifyToken } from "../shared/middleware/verifyToken.js";
import inventoryRoutes from "./inventory/routes/inventory.routes.ts";
import supplierRoutes from "./supplier/routes/supplier.route.js";
import purchaseRoutes from "./purchase/routes/purchase.route.js";
import { buildSalesRouter } from "./sales/routes/sales.routes.ts";
import { buildSaleItemRouter } from "./sales/routes/saleItem.routes.ts";
import { buildReturnRouter } from "./sales/routes/return.routes.ts";
import reportRoutes from "./smartReorder/routes/smartReorder.routes.ts";
import notificationRoutes from "./notification/routes/notification.routes.ts";
import dashboardRoutes from "./dashboard/routes/dashboard.routes.ts";
import {
  returnController,
  saleController,
  saleItemController,
} from "../app/container.ts";

const router = express.Router();

// auth and user-related routes
router.use("/auth", authRoutes);
router.use("/users", verifyToken, authorize(["owner"]), userRoutes);

// medicine-related routes
router.use(
  "/medicines",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  medicineRoutes,
);
router.use(
  "/units",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  unitRoutes,
);
router.use(
  "/categories",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  categoryRoutes,
);
router.use(
  "/brands",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  brandRoutes,
);
router.use(
  "/generic-names",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  genericNameRoutes,
);

// supplier-related routes

router.use(
  "/suppliers",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  supplierRoutes,
);

// purchase-related routes

router.use(
  "/purchases",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  purchaseRoutes,
);

// inventory-related routes

router.use(
  "/inventory",
  verifyToken,
  authorize(["owner", "inventory-manager"]),
  inventoryRoutes,
);

// sales routes

router.use("/sales", buildSalesRouter(saleController));
router.use("/sale-items", buildSaleItemRouter(saleItemController));
router.use("/returns", buildReturnRouter(returnController));

// smart reorder routes

router.use(
  "/smart-reorders",
  verifyToken,
  authorize(["owner", "inventory_manager"]),
  reportRoutes,
);

// notification routes
router.use(
  "/notifications",
  verifyToken,
  authorize(["owner", "inventory_manager"]),
  notificationRoutes,
);

router.use(
  "/dashboard",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  dashboardRoutes,
);
export default router;
