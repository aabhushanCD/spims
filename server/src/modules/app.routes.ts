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

export default router;
