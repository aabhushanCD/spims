import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { userController } from "../../../app/container.ts";

const router = express.Router();

router.post("/", (req: Request, res: Response, next: NextFunction) =>
  userController.createUser(req, res, next),
);
router.get("/:id", (req: Request, res: Response, next: NextFunction) =>
  userController.getUserById(req, res, next),
);
router.put("/:id", (req: Request, res: Response, next: NextFunction) =>
  userController.updateUser(req, res, next),
);
router.delete("/:id", (req: Request, res: Response, next: NextFunction) =>
  userController.deleteUser(req, res, next),
);
router.get("/", (req: Request, res: Response, next: NextFunction) =>
  userController.getAllUsers(req, res, next),
);
router.get("/role/:role", (req: Request, res: Response, next: NextFunction) =>
  userController.getUsersByRole(req, res, next),
);
router.get(
  "/status/:isActive/last-login/:date",
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByStatusAndLastLogin(req, res, next),
);
router.get(
  "/role/:role/last-login/:date",
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByRoleAndLastLogin(req, res, next),
);
router.get(
  "/role/:role/status/:isActive",
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByRoleAndStatus(req, res, next),
);
router.get("/active", (req: Request, res: Response, next: NextFunction) =>
  userController.getActiveUsers(req, res, next),
);
router.get("/:id/inactive", (req: Request, res: Response, next: NextFunction) =>
  userController.getInactiveUsers(req, res, next),
);
router.get(
  "/last-login/:date",
  (req: Request, res: Response, next: NextFunction) =>
    userController.getUsersByLastLogin(req, res, next),
);

router.get(
  "/status/:isActive/last-login/:date",
  (req: Request, res: Response, next: NextFunction) =>
    userController.findByStatusAndLastLogin(req, res, next),
);

router.patch(
  "/:id/toggleUserActivation",
  (req: Request, res: Response, next: NextFunction) =>
    userController.toggleUserActivation(req, res, next),
);
export default router;
