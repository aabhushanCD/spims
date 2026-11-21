import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "../schema/supplier.schema.js";
import {
  validate,
  validateParams,
} from "../../../shared/middleware/validate.middleware.ts";
import { supplierController } from "../../../app/container.ts";
import { supplierIdParamSchema } from "../schema/supplier.schema.ts";

const supplierRouter = Router();

supplierRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  supplierController.getAllSuppliers(req, res, next),
);
supplierRouter.get(
  "/:id",
  validateParams(supplierIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.getSupplierById(req, res, next),
);
supplierRouter.post(
  "/",
  validate(createSupplierSchema),
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.createSupplier(req, res, next),
);
supplierRouter.put(
  "/:id",
  validateParams(supplierIdParamSchema),
  validate(updateSupplierSchema),
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.updateSupplier(req, res, next),
);
supplierRouter.delete(
  "/:id",
  validateParams(supplierIdParamSchema),
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.deleteSupplier(req, res, next),
);

export default supplierRouter;
