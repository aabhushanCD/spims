import express from "express";

import { validate } from "../../../shared/middleware/validate.middleware.js";
import { registerSchema } from "../schema/register.schema.js";

import { loginSchema } from "../schema/login.schema.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { authController } from "../../../app/container.ts";
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

router.get("/me", verifyToken, (req, res) => {
  authController.getCurrentUser(req, res);
});

export default router;
