import { AppError } from "../../shared/error.ts";
import { batchService } from "../batch/batch.module.ts";
import { medicineRepo } from "../medicine/medicine.module.ts";
import { SmartReorderController } from "./controllers/smartReorder.controller.ts";
import SmartReorderModel from "./model/smartReorder.model.ts";
import { SmartReorderRepo } from "./repo/smartReorder.repo.ts";
import { SmartReorderService } from "./services/smartReorder.service.ts";

const smartReorderRepo = new SmartReorderRepo(SmartReorderModel);
const smartReorderService = new SmartReorderService(
  smartReorderRepo,
  batchService,
  medicineRepo,
  AppError,
);

const smartReorderController = new SmartReorderController(smartReorderService);

export { smartReorderService, smartReorderController };
