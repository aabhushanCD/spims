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
import salesRoutes from "./sales/routes/sales.routes.ts";
import { buildSaleItemRouter } from "./sales/routes/saleItem.routes.ts";
import { buildReturnRouter } from "./sales/routes/return.routes.ts";
import reportRoutes from "./smartReorder/routes/smartReorder.routes.ts";
import notificationRoutes from "./notification/routes/notification.routes.ts";
import dashboardRoutes from "./dashboard/routes/dashboard.routes.ts";
import { returnController, saleItemController } from "../app/container.ts";
import batchRoutes from "./batch/routes/batch.routes.ts";

const router = express.Router();

// auth and user-related routes
router.use("/auth", authRoutes);
router.use(
  "/users",
  verifyToken,
  authorize(["owner", "pharmacist"]),
  userRoutes,
);

// medicine-related routes
router.use(
  "/medicines",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  medicineRoutes,
);
router.use(
  "/units",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  unitRoutes,
);
router.use(
  "/categories",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  categoryRoutes,
);
router.use(
  "/brands",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  brandRoutes,
);
router.use(
  "/generic-names",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  genericNameRoutes,
);

// supplier-related routes

router.use(
  "/suppliers",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  supplierRoutes,
);

// purchase-related routes

router.use(
  "/purchases",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  purchaseRoutes,
);

// inventory-related routes

router.use(
  "/inventory",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  inventoryRoutes,
);

// sales routes

router.use(
  "/sales",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  salesRoutes,
);

router.use(
  "/sale-items",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  buildSaleItemRouter(saleItemController),
);
router.use(
  "/returns",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  buildReturnRouter(returnController),
);

// batch routes
router.use(
  "/batches",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  batchRoutes,
);

// smart reorder routes

router.use(
  "/smart-reorders",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  reportRoutes,
);

// notification routes
router.use(
  "/notifications",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  notificationRoutes,
);

router.use(
  "/dashboard",
  verifyToken,
  authorize(["owner", "inventory_manager", "pharmacist"]),
  dashboardRoutes,
);
export default router;
