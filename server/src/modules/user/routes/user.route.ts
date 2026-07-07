import express from "express";
import { userController } from "../../../app/container.ts";

const router = express.Router();

router.post("/", (req, res) => userController.createUser(req, res));
router.get("/:id", (req, res) => userController.getUserById(req, res));
router.put("/:id", (req, res) => userController.updateUser(req, res));
router.delete("/:id", (req, res) => userController.deleteUser(req, res));
router.get("/", (req, res) => userController.getAllUsers(req, res));
router.get("/role/:role", (req, res) =>
  userController.getUsersByRole(req, res),
);
router.get("/status/:isActive/last-login/:date", (req, res) =>
  userController.getUsersByStatusAndLastLogin(req, res),
);
router.get("/role/:role/last-login/:date", (req, res) =>
  userController.getUsersByRoleAndLastLogin(req, res),
);
router.get("/role/:role/status/:isActive", (req, res) =>
  userController.getUsersByRoleAndStatus(req, res),
);
router.get("/active", (req, res) => userController.getActiveUsers(req, res));
router.get("/inactive", (req, res) =>
  userController.getInactiveUsers(req, res),
);
router.get("/last-login/:date", (req, res) =>
  userController.getUsersByLastLogin(req, res),
);

router.get("/status/:isActive/last-login/:date", (req, res) =>
  userController.findByStatusAndLastLogin(req, res),
);

export default router;
