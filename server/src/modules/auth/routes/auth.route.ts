import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { authController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import {
  createRateLimiter,
  ipAndEmailKey,
} from "../../../shared/middleware/rateLimit.middleware.ts";
import { verifyOrigin } from "../../../shared/middleware/verifyOrigin.middleware.ts";
import { objectIdParamSchema } from "../../../shared/schema/objectId.schema.ts";
import { emailSchema } from "../schema/email.schema.ts";
import { loginSchema } from "../schema/login.schema.ts";
import { registerSchema } from "../schema/register.schema.ts";
import { resetPasswordSchema } from "../schema/resetPassword.schema.ts";
import { verifyEmailSchema } from "../schema/verifyEmail.schema.ts";

const router = express.Router();

const registerLimiter = createRateLimiter({
  prefix: "auth:register",
  windowMs: 60 * 60_000,
  max: 10,
  message: "Too many registration attempts. Please try again later.",
});

const loginIpLimiter = createRateLimiter({
  prefix: "auth:login-ip",
  windowMs: 15 * 60_000,
  max: 50,
  message: "Too many login attempts from this network. Please try again later.",
});

const loginAccountLimiter = createRateLimiter({
  prefix: "auth:login-account",
  windowMs: 15 * 60_000,
  max: 10,
  message: "Too many login attempts. Please try again in 15 minutes.",
  keyGenerator: ipAndEmailKey,
});

const refreshLimiter = createRateLimiter({
  prefix: "auth:refresh",
  windowMs: 15 * 60_000,
  max: 120,
  message: "Too many refresh attempts. Please sign in again.",
});

const forgotPasswordLimiter = createRateLimiter({
  prefix: "auth:forgot-password",
  windowMs: 60 * 60_000,
  max: 5,
  message:
    "Too many password reset requests. Please try again in an hour.",
});

const resetPasswordLimiter = createRateLimiter({
  prefix: "auth:reset-password",
  windowMs: 60 * 60_000,
  max: 10,
  message: "Too many password reset attempts. Please try again later.",
});

const verifyEmailLimiter = createRateLimiter({
  prefix: "auth:verify-email",
  windowMs: 60 * 60_000,
  max: 20,
  message: "Too many verification attempts. Please try again later.",
});

const resendVerificationLimiter = createRateLimiter({
  prefix: "auth:resend-verification",
  windowMs: 60 * 60_000,
  max: 5,
  message:
    "Too many verification email requests. Please try again in an hour.",
});

router.use(verifyOrigin);

router.post(
  "/register",
  registerLimiter,
  validate(registerSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.registerUser(req, res, next);
  },
);

router.post(
  "/login",
  loginIpLimiter,
  loginAccountLimiter,
  validate(loginSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.loginUser(req, res, next);
  },
);

router.post(
  "/refresh",
  refreshLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    authController.refreshToken(req, res, next);
  },
);

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  authController.logoutUser(req, res, next);
});

router.post(
  "/logout-all",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authController.logoutAllSessions(req, res, next);
  },
);

router.post(
  "/verify-email",
  verifyEmailLimiter,
  validate(verifyEmailSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.verifyEmail(req, res, next);
  },
);

router.post(
  "/resend-verification",
  resendVerificationLimiter,
  validate(emailSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.resendVerification(req, res, next);
  },
);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validate(emailSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.requestPasswordReset(req, res, next);
  },
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  validate(resetPasswordSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.resetPassword(req, res, next);
  },
);

router.get(
  "/me",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authController.getCurrentUser(req, res, next);
  },
);

router.get(
  "/sessions",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    authController.listSessions(req, res, next);
  },
);

router.delete(
  "/sessions/:id",
  verifyToken,
  validateParams(objectIdParamSchema),
  (req: Request, res: Response, next: NextFunction) => {
    authController.revokeSession(req, res, next);
  },
);

export default router;
