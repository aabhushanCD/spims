import type mongoose from "mongoose";

import type { IBatch } from "../../batch/model/medicineBatch.model.js";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.js";
import type { BatchAllocation } from "../../batch/types/batchAllocation.type.ts";
import type { AppError } from "../../../shared/error.ts";
import type { IInventory } from "../model/inventory.model.js";
import type { InventoryRepo } from "../repo/inventory.repo.js";
import type {
  StockMovementCtx,
  StockReferenceType,
} from "../types/stockMovement.type.ts";
import type { StockMutationService } from "./stockMutation.service.ts";

export type InventoryMovementCtx = Omit<StockMovementCtx, "medicineId">;

interface CreateInventoryInput {
  medicineId: string;
  currentStock?: number | undefined;
  reservedStock?: number | undefined;
  availableStock?: number | undefined;
  lastUpdated?: string | undefined;
}

export class InventoryService {
  constructor(
    private readonly inventoryRepo: InventoryRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly stockMutation: StockMutationService,
    private readonly appError: typeof AppError,
  ) {}

  private withMedicine(
    medicineId: string,
    ctx: InventoryMovementCtx,
  ): StockMovementCtx {
    return { ...ctx, medicineId };
  }

  private requireInventory(result: IInventory | null | undefined): IInventory {
    if (!result) {
      throw this.appError.conflict("Inventory record is unavailable");
    }
    return result;
  }

  async createInventory(
    inventoryData: CreateInventoryInput,
    movementCtx?: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    return this.stockMutation.initializeAggregate({
      medicineId: inventoryData.medicineId,
      reservedStock: inventoryData.reservedStock ?? 0,
      ctx: movementCtx
        ? this.withMedicine(inventoryData.medicineId, movementCtx)
        : undefined,
      session,
    });
  }

  async getAllInventories(
    session?: mongoose.ClientSession,
  ): Promise<IInventory[]> {
    return await this.inventoryRepo.findAll(session);
  }

  async searchMedicines(query: string) {
    return await this.inventoryRepo.searchMedicines(query);
  }

  async getInventoryById(id: string): Promise<IInventory | null> {
    return await this.inventoryRepo.findById(id);
  }

  async getInventoryByMedicineId(medicineId: string) {
    return await this.inventoryRepo.findByMedicineId(medicineId);
  }

  async increaseStock(
    medicineId: string,
    quantity: number,
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    if (!movementCtx.batchId) {
      throw this.appError.badRequest("batchId is required for stock changes");
    }
    const result = await this.stockMutation.increaseBatchStock({
      medicineId,
      batchId: movementCtx.batchId,
      quantity,
      ctx: this.withMedicine(medicineId, movementCtx),
      session,
    });
    return this.requireInventory(result.inventory);
  }

  async decreaseStock(
    medicineId: string,
    quantity: number,
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    if (!movementCtx.batchId) {
      throw this.appError.badRequest("batchId is required for stock changes");
    }
    const result = await this.stockMutation.decreaseBatchStock({
      medicineId,
      batchId: movementCtx.batchId,
      quantity,
      ctx: this.withMedicine(medicineId, movementCtx),
      session,
    });
    return this.requireInventory(result.inventory);
  }

  async reserveStock(
    medicineId: string,
    quantity: number,
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    return await this.stockMutation.reserveStock({
      medicineId,
      quantity,
      ctx: this.withMedicine(medicineId, movementCtx),
      session,
    });
  }

  async releaseReservedStock(
    medicineId: string,
    quantity: number,
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    return await this.stockMutation.releaseStock({
      medicineId,
      quantity,
      ctx: this.withMedicine(medicineId, movementCtx),
      session,
    });
  }

  async returnMedicine(
    medicineId: string,
    batchId: string,
    quantity: number,
    condition: "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED",
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | IBatch> {
    if (quantity <= 0) {
      throw this.appError.badRequest("Quantity must be greater than zero");
    }

    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (batch.medicineId.toString() !== medicineId) {
      throw this.appError.badRequest("Batch does not belong to medicine");
    }

    if (condition === "GOOD") {
      const result = await this.stockMutation.increaseBatchStock({
        medicineId,
        batchId,
        quantity,
        ctx: this.withMedicine(medicineId, {
          ...movementCtx,
          batchId,
          movementType: "RETURN",
          referenceType: movementCtx.referenceType ?? "SALES_RETURN",
        }),
        session,
      });
      return this.requireInventory(result.inventory);
    }

    await this.stockMutation.recordMovement(
      {
        ...this.withMedicine(medicineId, movementCtx),
        batchId,
        movementType: "RETURN",
        referenceType: movementCtx.referenceType ?? "SALES_RETURN",
        remarks:
          movementCtx.remarks ??
          `Returned (${condition}) — write-off; no stock restored`,
      },
      quantity,
      session,
    );

    return batch;
  }

  async syncInventoryFromBatch(
    medicineId: string,
    movementCtx?: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory> {
    return await this.stockMutation.syncAggregate(medicineId, {
      ctx: movementCtx
        ? this.withMedicine(medicineId, movementCtx)
        : undefined,
      session,
    });
  }

  async updateInventory(
    id: string,
    updateData: Partial<IInventory>,
    _movementCtx?: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    const allowedFields = new Set(["reservedStock", "lastUpdated"]);
    for (const key of Object.keys(updateData)) {
      if (!allowedFields.has(key)) {
        throw this.appError.badRequest(
          `Field ${key} cannot be updated directly; stock is derived from batches`,
        );
      }
    }

    const inventory = await this.inventoryRepo.findById(id, session);
    if (!inventory) {
      return null;
    }

    const totalStock = await this.batchRepo.getTotalStock(
      inventory.medicineId.toString(),
      session,
    );
    const reservedStock = updateData.reservedStock ?? inventory.reservedStock;
    if (!Number.isInteger(reservedStock) || reservedStock < 0) {
      throw this.appError.badRequest(
        "reservedStock must be a non-negative whole number",
      );
    }
    if (reservedStock > totalStock) {
      throw this.appError.badRequest(
        "reservedStock cannot exceed available batch stock",
      );
    }

    return await this.inventoryRepo.update(
      id,
      {
        reservedStock,
        currentStock: totalStock,
        availableStock: totalStock - reservedStock,
        lastUpdated: updateData.lastUpdated ?? new Date(),
      },
      session,
    );
  }

  async sellMedicine(
    medicineId: string,
    requestedQuantity: number,
    movementCtx: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<BatchAllocation[]> {
    if (requestedQuantity <= 0) {
      throw this.appError.badRequest("Quantity must be greater than zero");
    }
    const batches = await this.batchRepo.findSellableBatches(
      medicineId,
      session,
    );

    if (!batches.length) {
      throw this.appError.badRequest("Medicine is out of stock");
    }
    const totalAvailable = batches.reduce(
      (sum, batch) => sum + batch.quantityRemaining,
      0,
    );

    if (totalAvailable < requestedQuantity) {
      throw this.appError.badRequest(`Only ${totalAvailable} units available.`);
    }

    const allocations: BatchAllocation[] = [];
    let remaining = requestedQuantity;

    for (const batch of batches) {
      if (remaining <= 0) break;

      const batchId = batch._id.toString();
      const sellQty = Math.min(batch.quantityRemaining, remaining);
      await this.stockMutation.decreaseBatchStock({
        medicineId,
        batchId,
        quantity: sellQty,
        sync: false,
        ctx: this.withMedicine(medicineId, {
          ...movementCtx,
          batchId,
          movementType: "SALE",
          referenceType: "SALE" as StockReferenceType,
        }),
        session,
      });

      allocations.push({
        batchId,
        batchNumber: batch.batchNumber,
        medicineId,
        quantity: sellQty,
        unitPrice: batch.sellingPrice,
        purchasePrice: batch.purchasePrice,
      });

      remaining -= sellQty;
    }

    if (remaining > 0) {
      throw this.appError.conflict("Stock changed while processing sale.");
    }
    await this.stockMutation.syncAggregate(medicineId, { session });

    return allocations;
  }

  async deleteInventory(
    id: string,
    _movementCtx?: InventoryMovementCtx,
    session?: mongoose.ClientSession,
  ): Promise<IInventory | null> {
    const inventory = await this.inventoryRepo.findById(id, session);
    if (!inventory) {
      return null;
    }

    const totalStock = await this.batchRepo.getTotalStock(
      inventory.medicineId.toString(),
      session,
    );
    if (inventory.currentStock > 0 || inventory.reservedStock > 0 || totalStock > 0) {
      throw this.appError.conflict(
        "Cannot delete inventory with stock or reservations",
      );
    }

    return await this.inventoryRepo.delete(id, session);
  }
}
