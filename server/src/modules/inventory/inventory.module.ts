import { AppError } from "../../shared/error.ts";
import { medicineBatchRepo } from "../batch/batch.module.ts";
import { medicineRepo } from "../medicine/medicine.module.ts";
import { userRepository } from "../user/user.module.ts";
import { InventoryController } from "./controllers/inventory.controller.ts";
import Inventory from "./model/inventory.model.js";
import InventoryMovement from "./model/inventoryMovement.model.ts";
import StockAdjustment from "./model/stockAdjustment.model.js";

import { InventoryRepo } from "./repo/inventory.repo.js";
import { InventoryMovementRepo } from "./repo/inventoryMovement.repo.ts";
import { StockAdjustmentRepo } from "./repo/stockAdjustment.repo.js";
import { InventoryService } from "./services/inventory.service.ts";
import { InventoryMovementService } from "./services/inventoryMovement.service.ts";
import { StockAdjustmentService } from "./services/stockAdjust.service.ts";

const inventoryRepo = new InventoryRepo(Inventory);
const inventoryMovementRepo = new InventoryMovementRepo(InventoryMovement);
const stockAdjustmentRepo = new StockAdjustmentRepo(StockAdjustment);

const inventoryMovementService = new InventoryMovementService(
  inventoryMovementRepo,
  medicineRepo,
  medicineBatchRepo,
  userRepository,
  AppError,
);
const inventoryService = new InventoryService(
  inventoryRepo,
  inventoryMovementService,
  medicineBatchRepo,
);
const stockAdjustmentService = new StockAdjustmentService(stockAdjustmentRepo);

const inventoryController = new InventoryController(inventoryService);
export {
  inventoryController,
  inventoryRepo,
  inventoryMovementRepo,
  stockAdjustmentRepo,
  inventoryService,
  inventoryMovementService,
  stockAdjustmentService,
};
