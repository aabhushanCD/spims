import type mongoose from "mongoose";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.js";
import type { MedicineBatchRepo } from "../repo/medicineBatch.repo.js";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";

export class BatchService {
  constructor(
    private readonly batchRepo: MedicineBatchRepo,
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly inventoryService: InventoryService,
  ) {}

  async createBatch(
    batchData: any,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const purchaseOrder = await this.purchaseOrderRepo.findById(
      batchData.purchaseOrderId,
    );

    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    const batch = await this.batchRepo.create(batchData, session);
    return batch;
  }

  async getBatchById(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw new Error("Batch not found");
    }
    return batch;
  }

  async getAllBatches(session?: mongoose.ClientSession): Promise<any[]> {
    const batches = await this.batchRepo.findAll(session);
    return batches;
  }

  async getAvailableBatches(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<any[]> {
    const batches = await this.batchRepo.findAllByMedicineId(
      medicineId,
      session,
    );
    const availableBatches = batches.filter(
      (batch) => batch.quantityRemaining > 0 && batch.expiryDate > new Date(),
    );
    return availableBatches;
  }

  async updateBatch(
    batchId: string,
    updateData: any,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const updatedBatch = await this.batchRepo.update(
      batchId,
      updateData,
      session,
    );
    if (!updatedBatch) {
      throw new Error("Batch not found");
    }
    return updatedBatch;
  }

  async deleteBatch(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const deletedBatch = await this.batchRepo.delete(batchId, session);
    if (!deletedBatch) {
      throw new Error("Batch not found");
    }
    return deletedBatch;
  }

  async deductQuantity(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);

    if (!batch) {
      throw new Error("Batch not found");
    }
    if (batch.quantityRemaining < quantity) {
      throw new Error("Insufficient quantity available");
    }
    batch.quantityRemaining -= quantity;
    return await this.batchRepo.update(
      batchId,
      {
        quantityRemaining: batch.quantityRemaining,
      },
      session,
    );
  }

  async increaseQuantity(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw new Error("Batch not found");
    }
    batch.quantityRemaining += quantity;
    return await this.batchRepo.update(
      batchId,
      {
        quantityRemaining: batch.quantityRemaining,
      },
      session,
    );
  }

  async adjustStock(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw new Error("Batch not found");
    }
    batch.quantityRemaining = quantity;
    const updated = await this.batchRepo.update(
      batchId,
      {
        quantityRemaining: batch.quantityRemaining,
      },
      session,
    );
    await this.inventoryService.syncInventoryFromBatch(
      batch.medicineId.toString(),
      undefined,
      session,
    );
    return updated;
  }

  async markExpiredBatches(
    session?: mongoose.ClientSession,
  ): Promise<{ batchId: string; medicineId: string }[]> {
    const batches = await this.batchRepo.findAll(session);
    const now = new Date();
    const newlyExpired: { batchId: string; medicineId: string }[] = [];

    for (const batch of batches) {
      if (batch.quantityRemaining > 0 && batch.expiryDate < now && !batch.isExpired) {
        await this.batchRepo.update(
          batch._id.toString(),
          { isExpired: true },
          session,
        );
        newlyExpired.push({
          batchId: batch._id.toString(),
          medicineId: batch.medicineId.toString(),
        });
      }
    }

    return newlyExpired; // caller (the job) logs movements + notifies using this list
  }

  async getExpiredBatches(session?: mongoose.ClientSession): Promise<any[]> {
    const batches = await this.batchRepo.findAll(session);
    const now = new Date();
    const expiredBatches = batches.filter((batch) => batch.expiryDate < now);
    return expiredBatches;
  }

  async confirmDisposal(
    batchId: string,
    performedBy: string,
    remarks?: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) throw new Error("Batch not found");
    if (!batch.isExpired)
      throw new Error("Batch is not marked as expired — cannot dispose");
    if (batch.quantityRemaining <= 0)
      throw new Error("Batch has no remaining quantity to dispose");

    const disposedQuantity = batch.quantityRemaining;

    const updated = await this.batchRepo.update(
      batchId,
      { quantityRemaining: 0 },
      session,
    );

    // This both deducts and logs the movement — single source of truth,
    // consistent with how sales/purchases already flow through InventoryService.
    await this.inventoryService.decreaseStock(
      batch.medicineId.toString(),
      disposedQuantity,
      {
        batchId,
        referenceId: batchId,
        referenceType: "ADJUSTMENT",
        performedBy,
        movementType: "EXPIRED",
        remarks:
          remarks ??
          `Disposal confirmed for expired batch ${batch.batchNumber}`,
      },
      session,
    );

    return updated;
  }

  async getExpiredAwaitingDisposal(
    session?: mongoose.ClientSession,
  ): Promise<any[]> {
    return (await this.batchRepo.findAll(session)).filter(
      (b) => b.isExpired && b.quantityRemaining > 0,
    );
  }

  async getLowStockBatches(
    threshold: number,
    session?: mongoose.ClientSession,
  ): Promise<any[]> {
    const batches = await this.batchRepo.findAll(session);
    const lowStockBatches = batches.filter(
      (batch) =>
        batch.quantityRemaining <= threshold && batch.quantityRemaining > 0,
    );
    return lowStockBatches;
  }

  async allocateStock(
    medicineId: string,
    requestedQuantity: number,
    session?: mongoose.ClientSession,
  ) {
    const batches = await this.batchRepo.findAllByMedicineId(
      medicineId,
      session,
    );
    if (!batches || batches.length === 0) {
      throw new Error("No batches found for the given medicineId");
    }
    const availableBatches = batches.filter(
      (batch) => batch.quantityRemaining > 0 && batch.expiryDate > new Date(),
    );
    const totalAvailableQuantity = availableBatches.reduce(
      (sum, batch) => sum + batch.quantityRemaining,
      0,
    );
    if (totalAvailableQuantity < requestedQuantity) {
      throw new Error(
        `Insufficient stock. Requested: ${requestedQuantity}, Available: ${totalAvailableQuantity}`,
      );
    }

    const allocation: { batchId: string; quantity: number }[] = [];
    let remaining = requestedQuantity;

    for (const batch of availableBatches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantityRemaining, remaining);

      await this.batchRepo.update(
        batch._id.toString(),
        { quantityRemaining: batch.quantityRemaining - take },
        session,
      );
      await this.inventoryService.syncInventoryFromBatch(
        batch.medicineId.toString(),
        undefined,
        session,
      );
    }
    return allocation;
  }

  async getBatchByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findByMedicineId(medicineId, session);
    if (!batch) {
      throw new Error("Batch not found for the given medicineId");
    }
    return batch;
  }

  async getBatchHistory(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<any> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw new Error("Batch not found");
    }
    return {
      batchId: batch._id,
      medicineId: batch.medicineId,
      purchaseOrderId: batch.purchaseOrderId,
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      manufacturingDate: batch.manufacturingDate,
      purchasePrice: batch.purchasePrice,
      sellingPrice: batch.sellingPrice,
      quantityReceived: batch.quantityReceived,
      quantityRemaining: batch.quantityRemaining,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}
