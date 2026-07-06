import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";
import type { UserRepository } from "../../user/repo/user.repo.ts";
import type { InventoryMovementRepo } from "../repo/inventoryMovement.repo.js";
import type { CreateInventoryMovementDto } from "../schema/inventoryMovement.schema.ts";

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
    const medicineId = movementData.medicineId.toString();
    const batchId = movementData.batchId.toString();
    const userId = movementData.performedBy.toString();
    const medicine = await this.medicineRepo.findById(medicineId);
    const referenceType = movementData.referenceType || "SYSTEM"; // Default to "SYSTEM" if not provided
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }

    if (!movementData.batchId) {
      throw this.appError.badRequest("Batch ID is required");
    }

    const batch = await this.batchRepo.findById(batchId);

    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (batch.medicineId.toString() !== medicineId) {
      throw this.appError.badRequest(
        "Batch does not belong to the specified medicine",
      );
    }
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw this.appError.notFound("User not found");
    }
    return await this.inventoryMovementRepo.create(
      {
        medicineId: medicine._id,
        batchId: batch._id,
        movementType: movementData.movementType,
        quantity: movementData.quantity,
        referenceId: new Types.ObjectId(movementData.referenceId),
        performedBy: user._id,
        remarks: movementData.remarks,
      },
      session,
    );
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
