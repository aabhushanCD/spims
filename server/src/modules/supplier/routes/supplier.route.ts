import { Router } from "express";
import { supplierController } from "../supplier.module.js";

const supplierRouter = Router();

supplierRouter.get("/", (req, res) =>
  supplierController.getAllSuppliers(req, res),
);
supplierRouter.get("/:id", (req, res) =>
  supplierController.getSupplierById(req, res),
);
supplierRouter.post("/", (req, res) =>
  supplierController.createSupplier(req, res),
);
supplierRouter.put("/:id", (req, res) =>
  supplierController.updateSupplier(req, res),
);
supplierRouter.delete("/:id", (req, res) =>
  supplierController.deleteSupplier(req, res),
);

export default supplierRouter;
