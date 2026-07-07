import express from "express";

const router = express.Router();

import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  CreateBrandSchema,
  UpdateBrandSchema,
} from "../schema/brand.schema.js";
import { brandController } from "../../../app/container.ts";

router.post("/", validate(CreateBrandSchema), verifyToken, (req, res) => {
  brandController.createBrand(req, res);
});

router.get("/:id", verifyToken, (req, res) => {
  brandController.getBrandById(req, res);
});

router.get("/", verifyToken, (req, res) => {
  brandController.getAllBrands(req, res);
});

router.put("/:id", validate(UpdateBrandSchema), verifyToken, (req, res) => {
  brandController.updateBrand(req, res);
});

router.delete("/:id", verifyToken, (req, res) => {
  brandController.deleteBrand(req, res);
});

export default router;
