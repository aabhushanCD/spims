import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { registerSchema } from "../schema/register.schema.js";

import { loginSchema } from "../schema/login.schema.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { authController } from "../../../app/container.ts";
const router = express.Router();

router.post("/register", validate(registerSchema), (req:Request, res:Response, next:NextFunction) => {
  authController.registerUser(req, res, next);
});

router.post("/login", validate(loginSchema), (req:Request, res:Response, next:NextFunction) => {
  authController.loginUser(req, res, next);
});

router.post("/logout", verifyToken, (req:Request, res:Response, next:NextFunction) => {
  authController.logoutUser(req, res, next);
});

router.get("/me", verifyToken, (req:Request, res:Response, next:NextFunction) => {
  authController.getCurrentUser(req, res, next);
});

export default router;
