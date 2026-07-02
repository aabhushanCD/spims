import express from "express";

import { validate } from "../../../shared/middleware/validate.middleware.js";
import { registerSchema } from "../schema/register.schema.js";
import { authController } from "../auth.module.js";
import { loginSchema } from "../schema/login.schema.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
const router = express.Router();

router.post("/register", validate(registerSchema), (req, res) => {
  authController.registerUser(req, res);
});

router.post("/login", validate(loginSchema), (req, res) => {
  authController.loginUser(req, res);
});

router.post("/logout", verifyToken, (req, res) => {
  authController.logoutUser(req, res);
});

export default router;
