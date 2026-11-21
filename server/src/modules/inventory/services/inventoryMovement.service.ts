import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import { parseOrThrow } from "../../../shared/utils/parseOrThrow.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import type { IInventoryMovement } from "../model/inventoryMovement.model.ts";
import type { InventoryMovementRepo } from "../repo/inventoryMovement.repo.js";
import {
  createInventoryMovementSchema,
  type CreateInventoryMovementDto,
} from "../schema/inventoryMovement.schema.ts";
import type { StockReferenceType } from "../types/stockMovement.type.ts";

export class InventoryMovementService {
  constructor(
    private readonly inventoryMovementRepo: InventoryMovementRepo,
    private readonly medicineRepo: MedicineRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly userRepo: UserRepository,
    private readonly appError: typeof AppError,
  ) {}

  async createMovement(
    movementData: CreateInventoryMovementDto,
    session?: mongoose.ClientSession,
  ) {
    const validated = parseOrThrow(
      createInventoryMovementSchema,
      movementData,
    );
    const medicineId = validated.medicineId.toString();
    const userId = validated.performedBy.toString();
    const medicine = await this.medicineRepo.findById(medicineId);
    const referenceType: StockReferenceType =
      (validated.referenceType as StockReferenceType) || "SYSTEM";
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }

    const batch = validated.batchId
      ? await this.batchRepo.findById(validated.batchId.toString(), session)
      : null;

    if (validated.batchId && !batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (batch && batch.medicineId.toString() !== medicineId) {
      throw this.appError.badRequest(
        "Batch does not belong to the specified medicine",
      );
    }
    const user = await this.userRepo.findById(userId, session);

    if (!user) {
      throw this.appError.notFound("User not found");
    }
    const movementRecord: Partial<IInventoryMovement> = {
      medicineId: medicine._id,
      movementType: validated.movementType,
      quantity: validated.quantity,
      referenceId: new Types.ObjectId(validated.referenceId),
      referenceType,
      performedBy: user._id,
      remarks: validated.remarks,
    };
    if (batch) {
      movementRecord.batchId = batch._id;
    }

    return await this.inventoryMovementRepo.create(movementRecord, session);
  }

  async getMovementById(id: string) {
    const movement = await this.inventoryMovementRepo.findById(id);
    if (!movement) {
      throw this.appError.notFound("Inventory movement not found");
    }
    return movement;
  }

  async getMovementsByMedicineId(medicineId: string) {
    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }
    return await this.inventoryMovementRepo.findAllByMedicineId(medicineId);
  }

  async getMovementsByBatch(batchId: string) {
    const batch = await this.batchRepo.findById(batchId);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    return await this.inventoryMovementRepo.findAllByBatchId(batchId);
  }

  async getMovementsByReference(referenceId: string) {
    const reference =
      await this.inventoryMovementRepo.findAllByReference(referenceId);
    if (!reference) {
      throw this.appError.notFound("Inventory movement not found");
    }
    return reference;
  }

  async getStockLedgerByMedicineId(medicineId: string) {
    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }
    return await this.inventoryMovementRepo.findAllByMedicineId(medicineId);
  }

  async getRecentMovements(limit: number) {
    if (limit <= 0) {
      throw this.appError.badRequest("Limit must be greater than zero");
    }
    return this.inventoryMovementRepo.findRecent(limit);
  }
}
