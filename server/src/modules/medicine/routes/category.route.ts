import express from "express";

const router = express.Router();

import { categoryController } from "../medicine.module.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../schema/category.schema.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";

router.post("/", validate(createCategorySchema), verifyToken, (req, res) => {
  categoryController.createCategory(req, res);
});

router.get("/:id", verifyToken, (req, res) => {
  categoryController.getCategoryById(req, res);
});

router.get("/", verifyToken, (req, res) => {
  categoryController.getAllCategories(req, res);
});

router.put("/:id", validate(updateCategorySchema), verifyToken, (req, res) => {
  categoryController.updateCategory(req, res);
});

router.delete("/:id", verifyToken, (req, res) => {
  categoryController.deleteCategory(req, res);
});

export default router;
