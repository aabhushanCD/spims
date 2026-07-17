import mongoose from "mongoose";
import BackgroundJobModel from "../modules/backgroundJobs/model/backgroud.model.ts";
import { BackgroundJobRepo } from "../modules/backgroundJobs/repo/background.repo.ts";
import { BackgroundJobService } from "../modules/backgroundJobs/service/background.service.ts";
import Batch from "../modules/batch/model/medicineBatch.model.ts";
import { MedicineBatchRepo } from "../modules/batch/repo/medicineBatch.repo.ts";
import { BatchService } from "../modules/batch/service/batch.service.ts";
import Inventory from "../modules/inventory/model/inventory.model.ts";
import InventoryMovement from "../modules/inventory/model/inventoryMovement.model.ts";
import { InventoryRepo } from "../modules/inventory/repo/inventory.repo.ts";
import { InventoryMovementRepo } from "../modules/inventory/repo/inventoryMovement.repo.ts";
import { InventoryService } from "../modules/inventory/services/inventory.service.ts";
import { InventoryMovementService } from "../modules/inventory/services/inventoryMovement.service.ts";
import { Medicine } from "../modules/medicine/models/medicine.model.ts";
import { MedicineRepo } from "../modules/medicine/repo/medicine.repo.ts";
import NotificationModel from "../modules/notification/model/notification.model.ts";
import NotificationRecipientModel from "../modules/notification/model/notificationRecipient.model.ts";
import { NotificationRepo } from "../modules/notification/repo/notification.repo.ts";
import { NotificationRecipientRepo } from "../modules/notification/repo/notificationRecipient.repo.ts";
import { NotificationService } from "../modules/notification/services/notification.service.ts";
import PurchaseOrder from "../modules/purchase/model/purchaseOrder.model.ts";
import { PurchaseOrderRepo } from "../modules/purchase/repo/purchaseOrder.repo.ts";
import Sales from "../modules/sales/model/sales.model.ts";
import SalesItem from "../modules/sales/model/salesItem.model.ts";
import { SaleItemRepo } from "../modules/sales/repo/saleItem.repo.ts";
import { SalesRepo } from "../modules/sales/repo/sales.repo.ts";
import SmartReorderModel from "../modules/smartReorder/model/smartReorder.model.ts";
import { SmartReorderRepo } from "../modules/smartReorder/repo/smartReorder.repo.ts";
import Supplier from "../modules/supplier/model/supplier.model.ts";
import { SupplierRepo } from "../modules/supplier/repo/supplier.repo.ts";
import { User } from "../modules/user/model/user.model.ts";
import { UserRepository } from "../modules/user/repo/user.repo.ts";
import { UserService } from "../modules/user/service/user.service.ts";
import { AppError } from "../shared/error.ts";
import { PurchaseOrderService } from "../modules/purchase/services/purchaseOrder.service.ts";
import { PurchaseOrderItemRepo } from "../modules/purchase/repo/purchaseOrderItem.repo.ts";
import PurchaseOrderItem from "../modules/purchase/model/purchaseOrderItem.model.ts";
import { ReturnRepo } from "../modules/sales/repo/return.repo.ts";
import Return from "../modules/sales/model/return.model.ts";
import { ReturnService } from "../modules/sales/services/return.service.ts";
import { SmartReorderService } from "../modules/smartReorder/services/smartReorder.service.ts";
import { SupplierService } from "../modules/supplier/service/supplier.service.ts";
import { UserController } from "../modules/user/controller/user.controller.ts";
import { InventoryController } from "../modules/inventory/controllers/inventory.controller.ts";
import { BatchController } from "../modules/batch/controller/batch.controller.ts";
import { NotificationController } from "../modules/notification/controller/notification.controller.ts";
import { PurchaseController } from "../modules/purchase/controller/purchase.controller.ts";
import { ReturnController } from "../modules/sales/controller/return.controller.ts";
import { SmartReorderController } from "../modules/smartReorder/controllers/smartReorder.controller.ts";
import { SupplierController } from "../modules/supplier/controller/supplier.controller.ts";
import { AuthController } from "../modules/auth/controller/auth.controller.ts";
import { AuthService } from "../modules/auth/services/auth.service.ts";
import { MedicineController } from "../modules/medicine/controller/medicine.controller.ts";
import { MedicineService } from "../modules/medicine/services/medicine.sercive.ts";
import { UnitController } from "../modules/medicine/controller/unit.controller.ts";
import { UnitService } from "../modules/medicine/services/unit.service.ts";
import { GenericNameService } from "../modules/medicine/services/genericName.service.ts";
import { CategoryService } from "../modules/medicine/services/category.service.ts";
import { BrandService } from "../modules/medicine/services/brand.service.ts";
import { UnitRepo } from "../modules/medicine/repo/unit.repo.ts";
import { GenericNameRepo } from "../modules/medicine/repo/genericName.repo.ts";
import { Unit } from "../modules/medicine/models/unit.model.ts";
import { GenericName } from "../modules/medicine/models/genericName.model.ts";
import { CategoryRepo } from "../modules/medicine/repo/category.repo.ts";
import { Category } from "../modules/medicine/models/category.model.ts";
import { BrandRepo } from "../modules/medicine/repo/brand.repo.ts";
import { Brand } from "../modules/medicine/models/brand.model.ts";
import { GenericNameController } from "../modules/medicine/controller/genericName.controller.ts";
import { CategoryController } from "../modules/medicine/controller/category.controller.ts";
import { BrandController } from "../modules/medicine/controller/brand.controller.ts";
import { SaleItemService } from "../modules/sales/services/saleItem.service.ts";
import { SaleItemController } from "../modules/sales/controller/salesItem.controller.ts";
import { SalesController } from "../modules/sales/controller/sales.controller.ts";
import { SalesService } from "../modules/sales/services/sales.service.ts";
import { DashboardService } from "../modules/dashboard/service/dashboard.service.ts";
import { DashboardController } from "../modules/dashboard/controller/dashboard.controller.ts";
import { CounterRepository } from "../modules/sales/repo/counter.repo.ts";

// This file serves as a centralized container for all repository instances used throughout the application. It imports the necessary models and repository classes, then creates instances of each repository, which can be exported and used in other parts of the application. This approach promotes modularity and makes it easier to manage dependencies.
const userRepo = new UserRepository(User);
const backgroundJobRepository = new BackgroundJobRepo(BackgroundJobModel);
const medicineBatchRepo = new MedicineBatchRepo(Batch);
const inventoryRepo = new InventoryRepo(Inventory);
const inventoryMovementRepo = new InventoryMovementRepo(InventoryMovement);
const unitRepo = new UnitRepo(Unit);
const genericNameRepo = new GenericNameRepo(GenericName);
const categoryRepo = new CategoryRepo(Category);
const brandRepo = new BrandRepo(Brand);
const medicineRepo = new MedicineRepo(Medicine);
const notificationRecipientRepo = new NotificationRecipientRepo(
  NotificationRecipientModel,
);
const notificationRepo = new NotificationRepo(NotificationModel);
const purchaseOrderRepo = new PurchaseOrderRepo(PurchaseOrder);
const purchaseOrderItemRepo = new PurchaseOrderItemRepo(PurchaseOrderItem);
const returnRepo = new ReturnRepo(Return);
const saleItemRepo = new SaleItemRepo(SalesItem);
const saleRepo = new SalesRepo(Sales);

const smartReorderRepo = new SmartReorderRepo(SmartReorderModel);
const supplierRepo = new SupplierRepo(Supplier);
const counterRepo = new CounterRepository();
// services

const userService = new UserService(userRepo);
const authService = new AuthService(userRepo, AppError);

const backgroundJobService = new BackgroundJobService(
  backgroundJobRepository,
  AppError,
);
const inventoryMovementService = new InventoryMovementService(
  inventoryMovementRepo,
  medicineRepo,
  medicineBatchRepo,
  userRepo,
  AppError,
);
const inventoryService = new InventoryService(
  inventoryRepo,
  inventoryMovementService,
  medicineBatchRepo,
);
const unitService = new UnitService(unitRepo, AppError);
const genericNameService = new GenericNameService(genericNameRepo, AppError);
const categoryService = new CategoryService(categoryRepo, AppError);
const brandService = new BrandService(brandRepo, AppError);
const medicineService = new MedicineService(
  medicineRepo,
  AppError,
  genericNameService,
  brandService,
  categoryService,
);

const medicineBatchService = new BatchService(
  medicineBatchRepo,
  purchaseOrderRepo,
  inventoryService,
);

const notificationService = new NotificationService(
  notificationRepo,
  notificationRecipientRepo,
  userRepo,
  AppError,
  mongoose.connection,
);

const purchaseOrderService = new PurchaseOrderService(
  purchaseOrderRepo,
  supplierRepo,
  purchaseOrderItemRepo,
  inventoryService,
  inventoryMovementService,
  medicineBatchService,
  userRepo,
  AppError,
);

const returnService = new ReturnService(
  returnRepo,
  saleItemRepo,
  saleRepo,
  inventoryService,
  AppError,
  mongoose.connection,
);
const saleItemService = new SaleItemService(saleItemRepo, AppError);

const saleService = new SalesService(
  saleRepo,
  saleItemRepo,
  inventoryService,
  medicineBatchRepo,
  counterRepo,
  AppError,
  mongoose.connection,
);

const smartReorderService = new SmartReorderService(
  smartReorderRepo,
  medicineBatchService,
  medicineRepo,
  saleItemRepo,
  medicineBatchRepo,
  purchaseOrderRepo,
  supplierRepo,
  AppError,
);

const supplierService = new SupplierService(supplierRepo, AppError);
const dashboardService = new DashboardService(
  saleRepo,
  saleItemRepo,
  purchaseOrderRepo,
  inventoryRepo,
  medicineBatchRepo,
  supplierRepo,
  smartReorderService,
  medicineBatchService,
  inventoryMovementService,
  backgroundJobService,
  notificationRecipientRepo,
);
// controllers
const authController = new AuthController(authService);
const userController = new UserController(userService);
const inventoryController = new InventoryController(inventoryService);
const medicineBatchController = new BatchController(medicineBatchService);
const notificationController = new NotificationController(notificationService);
const purchaseOrderController = new PurchaseController(purchaseOrderService);
const returnController = new ReturnController(returnService);
const saleItemController = new SaleItemController(saleItemService);
const saleController = new SalesController(saleService);
const smartReorderController = new SmartReorderController(smartReorderService);
const supplierController = new SupplierController(supplierService);
const batchController = new BatchController(medicineBatchService);
const genericNameController = new GenericNameController(genericNameService);
const categoryController = new CategoryController(categoryService);
const brandController = new BrandController(brandService);
const unitController = new UnitController(unitService);
const medicineController = new MedicineController(medicineService);
const dashboardController = new DashboardController(dashboardService);
export {
  userRepo,
  authService,
  authController,
  backgroundJobRepository,
  medicineBatchRepo,
  inventoryRepo,
  inventoryMovementRepo,
  unitRepo,
  genericNameRepo,
  categoryRepo,
  brandRepo,
  medicineRepo,
  notificationRecipientRepo,
  notificationRepo,
  purchaseOrderRepo,
  purchaseOrderItemRepo,
  saleItemRepo,
  saleRepo,
  returnRepo,
  smartReorderRepo,
  supplierRepo,
  userService,
  backgroundJobService,
  inventoryMovementService,
  inventoryService,
  unitService,
  genericNameService,
  categoryService,
  brandService,
  medicineService,
  medicineBatchService,
  notificationService,
  purchaseOrderService,
  returnService,
  saleItemService,
  saleService,
  smartReorderService,
  supplierService,
  userController,
  inventoryController,
  batchController,
  genericNameController,
  categoryController,
  brandController,
  unitController,
  medicineController,
  medicineBatchController,
  notificationController,
  purchaseOrderController,
  saleItemController,
  saleController,
  returnController,
  smartReorderController,
  supplierController,
  dashboardService,
  dashboardController,
};
