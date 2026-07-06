import mongoose from "mongoose";
import { AppError } from "../../shared/error.ts";
import { medicineBatchRepo } from "../batch/batch.module.ts";
import { inventoryService } from "../inventory/inventory.module.ts";
import { SaleItemController } from "./controller/salesItem.controller.ts";
import Sales from "./model/sales.model.ts";
import SalesItem from "./model/salesItem.model.ts";
import { SaleItemRepo } from "./repo/saleItem.repo.ts";
import { SalesRepo } from "./repo/sales.repo.ts";
import { SaleItemService } from "./services/saleItem.service.ts";
import { SalesService } from "./services/sales.service.ts";
import { SalesController } from "./controller/sales.controller.ts";
import { ReturnRepo } from "./repo/return.repo.ts";
import Return from "./model/return.model.ts";
import { ReturnService } from "./services/return.service.ts";
import { ReturnController } from "./controller/return.controller.ts";

const returnRepo = new ReturnRepo(Return);
const saleItemRepo = new SaleItemRepo(SalesItem);
const saleRepo = new SalesRepo(Sales);

const saleItemService = new SaleItemService(saleItemRepo, AppError);

const returnService = new ReturnService(
  returnRepo,
  saleItemRepo,
  saleRepo,
  inventoryService,
  AppError,
  mongoose.connection,
);

const saleService = new SalesService(
  saleRepo,
  saleItemRepo,
  inventoryService,
  medicineBatchRepo,
  AppError,
  mongoose.connection,
);

const saleItemController = new SaleItemController(saleItemService);
const returnController = new ReturnController(returnService);
const saleController = new SalesController(saleService);

export {
  saleItemController,
  returnController,
  saleController,
  saleItemService,
  saleService,
  saleItemRepo,
  saleRepo,
};
