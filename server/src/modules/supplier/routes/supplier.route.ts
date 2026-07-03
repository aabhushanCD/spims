import { Router } from "express";
import { supplierController } from "../supplier.module.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../schema/supplier.schema.js";
import { validate } from "../../../shared/middleware/validate.middleware.js";

const supplierRouter = Router();

supplierRouter.get("/", (req, res) =>
  supplierController.getAllSuppliers(req, res),
);
supplierRouter.get("/:id", (req, res) =>
  supplierController.getSupplierById(req, res),
);
supplierRouter.post("/", validate(createSupplierSchema), (req, res) =>
  supplierController.createSupplier(req, res),
);
supplierRouter.put("/:id", validate(updateSupplierSchema), (req, res) =>
  supplierController.updateSupplier(req, res),
);
supplierRouter.delete("/:id", (req, res) =>
  supplierController.deleteSupplier(req, res),
);

export default supplierRouter;
