import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { userController } from "../../../app/container.ts";
import { authorize } from "../../../shared/middleware/authorize.ts";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  changeUserRoleSchema,
  createUserSchema,
  deleteUserBodySchema,
  updateUserSchema,
  userDateParamSchema,
  userIdParamSchema,
  userRoleDateParamSchema,
  userRoleParamSchema,
  userRoleStatusParamSchema,
  userStatusDateParamSchema,
} from "../schema/user.schema.ts";

const router = express.Router();
const ownerOnly = authorize(["owner"]);

router.post(
  "/",
  ownerOnly,
  validate(createUserSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.createUser(req, res, next),
);

// Static and more specific routes must be registered before GET /:id.
router.get("/active", (req: Request, res: Response, next: NextFunction) =>
  userController.getActiveUsers(req, res, next),
);
router.get("/inactive", (req: Request, res: Response, next: NextFunction) =>
  userController.getInactiveUsers(req, res, next),
);
router.get(
  "/role/:role",
  validateParams(userRoleParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByRole(req, res, next),
);
router.get(
  "/role/:role/status/:isActive",
  validateParams(userRoleStatusParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByRoleAndStatus(req, res, next),
);
router.get(
  "/role/:role/last-login/:date",
  validateParams(userRoleDateParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByRoleAndLastLogin(req, res, next),
);
router.get(
  "/status/:isActive/last-login/:date",
  validateParams(userStatusDateParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByStatusAndLastLogin(req, res, next),
);
router.get(
  "/last-login/:date",
  validateParams(userDateParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByLastLogin(req, res, next),
);
router.get("/", (req: Request, res: Response, next: NextFunction) =>
  userController.getAllUsers(req, res, next),
);

router.get(
  "/:id",
  validateParams(userIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUserById(req, res, next),
);
router.put(
  "/:id",
  ownerOnly,
  validateParams(userIdParamSchema),
  validate(updateUserSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.updateUser(req, res, next),
);
router.patch(
  "/:id/role",
  ownerOnly,
  validateParams(userIdParamSchema),
  validate(changeUserRoleSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.changeRole(req, res, next),
);
router.patch(
  "/:id/toggleUserActivation",
  ownerOnly,
  validateParams(userIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.toggleUserActivation(req, res, next),
);
router.delete(
  "/:id",
  ownerOnly,
  validateParams(userIdParamSchema),
  validate(deleteUserBodySchema),
  (req: Request, res: Response, next: NextFunction) =>
    userController.deleteUser(req, res, next),
);

export default router;
