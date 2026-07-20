import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

const router = express.Router();

import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  CreateGenericNameSchema,
  UpdateGenericNameSchema,
} from "../schema/genericName.schema.js";
import { genericNameController } from "../../../app/container.ts";

router.post(
  "/",
  validate(CreateGenericNameSchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    genericNameController.createGenericName(req, res, next);
  },
);

router.get(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    genericNameController.getGenericNameById(req, res, next);
  },
);

router.get(
  "/",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    genericNameController.getAllGenericNames(req, res, next);
  },
);

router.put(
  "/:id",
  validate(UpdateGenericNameSchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    genericNameController.updateGenericName(req, res, next);
  },
);

router.delete(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    genericNameController.deleteGenericName(req, res, next);
  },
);

export default router;
