import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

const router = express.Router();

import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schema/category.schema.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { categoryController } from "../../../app/container.ts";

router.post(
  "/",
  validate(createCategorySchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    categoryController.createCategory(req, res, next);
  },
);

router.get(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    categoryController.getCategoryById(req, res, next);
  },
);

router.get(
  "/",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    categoryController.getAllCategories(req, res, next);
  },
);

router.put(
  "/:id",
  validate(updateCategorySchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    categoryController.updateCategory(req, res, next);
  },
);

router.delete(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    categoryController.deleteCategory(req, res, next);
  },
);

export default router;
