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
import { validate } from "../../../shared/middleware/validate.middleware.js";
import { supplierController } from "../../../app/container.ts";

const supplierRouter = Router();

supplierRouter.get("/", (req: Request, res: Response, next: NextFunction) =>
  supplierController.getAllSuppliers(req, res, next),
);
supplierRouter.get("/:id", (req: Request, res: Response, next: NextFunction) =>
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
  validate(updateSupplierSchema),
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.updateSupplier(req, res, next),
);
supplierRouter.delete(
  "/:id",
  (req: Request, res: Response, next: NextFunction) =>
    supplierController.deleteSupplier(req, res, next),
);

export default supplierRouter;
