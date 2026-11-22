import { Router } from "express";

import { customerController } from "../../../app/container.ts";
import {
  validate,
  validateParams,
  validateQuery,
} from "../../../shared/middleware/validate.middleware.ts";
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "../schema/customer.schema.ts";

const router = Router();

router.post(
  "/",
  validate(createCustomerSchema),
  (req, res, next) => customerController.create(req, res, next),
);
router.get(
  "/",
  validateQuery(customerListQuerySchema),
  (req, res, next) => customerController.getAll(req, res, next),
);
router.get(
  "/:id",
  validateParams(customerIdParamSchema),
  (req, res, next) => customerController.getById(req, res, next),
);
router.put(
  "/:id",
  validateParams(customerIdParamSchema),
  validate(updateCustomerSchema),
  (req, res, next) => customerController.update(req, res, next),
);
router.delete(
  "/:id",
  validateParams(customerIdParamSchema),
  (req, res, next) => customerController.delete(req, res, next),
);

export default router;
