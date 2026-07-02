import express from "express";

const router = express.Router();

import { genericNameController } from "../medicine.module.js";
import { verifyToken } from "../../../shared/middleware/verifyToken.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";
import {
  CreateGenericNameSchema,
  UpdateGenericNameSchema,
} from "../schema/genericName.schema.js";

router.post("/", validate(CreateGenericNameSchema), verifyToken, (req, res) => {
  genericNameController.createGenericName(req, res);
});

router.get("/:id", verifyToken, (req, res) => {
  genericNameController.getGenericNameById(req, res);
});

router.get("/", verifyToken, (req, res) => {
  genericNameController.getAllGenericNames(req, res);
});

router.put(
  "/:id",
  validate(UpdateGenericNameSchema),
  verifyToken,
  (req, res) => {
    genericNameController.updateGenericName(req, res);
  },
);

router.delete("/:id", verifyToken, (req, res) => {
  genericNameController.deleteGenericName(req, res);
});

export default router;
