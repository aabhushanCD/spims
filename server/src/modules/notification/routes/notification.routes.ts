// notification.routes.ts
import { Router } from "express"; // adjust to your actual module file
import { notificationController } from "../../../app/container.ts";


const router = Router();

router.get("/me", notificationController.getForCurrentUser);
router.get("/user/:userId", notificationController.getForUser);

router.post("/", notificationController.createNotification);
router.get("/", notificationController.getAll);
router.get("/:id", notificationController.getById);

router.post("/:id/dispatch", notificationController.dispatch);
router.delete("/:id", notificationController.delete);

export default router;
