import { AppError } from "../../shared/error.js";
import { SupplierController } from "./controller/supplier.controller.js";
import SupplierModel from "./model/supplier.model.js";
import { SupplierRepo } from "./repo/supplier.repo.js";
import { SupplierService } from "./service/supplier.service.js";

const supplierRepo = new SupplierRepo(SupplierModel);
const supplierService = new SupplierService(supplierRepo, AppError);
const supplierController = new SupplierController(supplierService);

export { supplierController, supplierService, supplierRepo };
