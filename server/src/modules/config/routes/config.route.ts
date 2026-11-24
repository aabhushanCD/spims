import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import { ConfigController } from "../controller/config.controller.ts";

const router = express.Router();
const configController = new ConfigController();

router.get("/", (req: Request, res: Response, next: NextFunction) => {
  configController.getWorkspaceConfig(req, res, next);
});

export default router;
