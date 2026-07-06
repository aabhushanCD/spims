import { AppError } from "../../shared/error.ts";
import { batchService } from "../batch/batch.module.ts";
import {
  inventoryMovementService,
  inventoryService,
} from "../inventory/inventory.module.ts";

import { supplierRepo } from "../supplier/supplier.module.ts";
import { userRepository } from "../user/user.module.ts";
import { PurchaseController } from "./controller/purchase.controller.ts";
import PurchaseOrder from "./model/purchaseOrder.model.ts";
import PurchaseOrderItem from "./model/purchaseOrderItem.model.ts";
import { PurchaseOrderRepo } from "./repo/purchaseOrder.repo.ts";
import { PurchaseOrderItemRepo } from "./repo/purchaseOrderItem.repo.ts";
import { PurchaseOrderService } from "./services/purchaseOrder.service.ts";

const purchaseOrderRepo = new PurchaseOrderRepo(PurchaseOrder);
const purchaseOrderItemRepo = new PurchaseOrderItemRepo(PurchaseOrderItem);
const purchaseOrderService = new PurchaseOrderService(
  purchaseOrderRepo,
  supplierRepo,
  purchaseOrderItemRepo,
  inventoryService,
  inventoryMovementService,
  batchService,
  userRepository,
  AppError,
);

const purchaseOrderController = new PurchaseController(purchaseOrderService);

export {
  purchaseOrderRepo,
  purchaseOrderItemRepo,
  purchaseOrderService,
  purchaseOrderController,
};
