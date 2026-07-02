import express from "express";

import authRoutes from "./auth/routes/auth.route.js";
import userRoutes from "./user/routes/user.route.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
