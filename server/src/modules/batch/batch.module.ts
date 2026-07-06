import { inventoryService } from "../inventory/inventory.module.ts";
import { purchaseOrderRepo } from "../purchase/purchase.module.js";
import { BatchController } from "./controller/batch.controller.ts";
import Batch from "./model/medicineBatch.model.js";
import { MedicineBatchRepo } from "./repo/medicineBatch.repo.js";
import { BatchService } from "./service/batch.service.js";

const medicineBatchRepo = new MedicineBatchRepo(Batch);
const batchService = new BatchService(
  medicineBatchRepo,
  purchaseOrderRepo,
  inventoryService,
);
const batchController = new BatchController(batchService);

export { medicineBatchRepo, batchService, batchController };
