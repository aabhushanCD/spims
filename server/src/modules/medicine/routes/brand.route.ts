import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

const router = express.Router();

import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  CreateBrandSchema,
  UpdateBrandSchema,
} from "../schema/brand.schema.js";
import { brandController } from "../../../app/container.ts";

router.post(
  "/",
  validate(CreateBrandSchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    brandController.createBrand(req, res, next);
  },
);

router.get(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    brandController.getBrandById(req, res, next);
  },
);

router.get(
  "/",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    brandController.getAllBrands(req, res, next);
  },
);

router.put(
  "/:id",
  validate(UpdateBrandSchema),
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    brandController.updateBrand(req, res, next);
  },
);

router.delete(
  "/:id",
  verifyToken,
  (req: Request, res: Response, next: NextFunction) => {
    brandController.deleteBrand(req, res, next);
  },
);

export default router;
