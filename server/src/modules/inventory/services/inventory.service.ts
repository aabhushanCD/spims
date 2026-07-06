import mongoose, { Types } from "mongoose";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.js";
import type { IInventory } from "../model/inventory.model.js";
import type { InventoryRepo } from "../repo/inventory.repo.js";
import type { InventoryMovementService } from "./inventoryMovement.service.ts";

interface ImovementCtx {
  batchId: string;
  referenceId: string;
  movementType:
    | "PURCHASE"
    | "SALE"
    | "RETURN"
    | "ADJUSTMENT"
    | "EXPIRED"
    | "RESERVE"
    | "RELEASE";
  referenceType: string;
  performedBy: string;
  remarks: string;
}
export class InventoryService {
  constructor(
    private readonly inventoryRepo: InventoryRepo,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly batchRepo: MedicineBatchRepo,
  ) {}

  async createInventory(
    inventoryData: {
      medicineId: string;
      currentStock: number;
      reservedStock: number;
      availableStock: number;
      lastUpdated: string;
    },
    movementCtx?: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const inventory = await this.inventoryRepo.create(
      {
        medicineId: new Types.ObjectId(inventoryData.medicineId),
        currentStock: inventoryData.currentStock,
        reservedStock: inventoryData.reservedStock,
        availableStock: inventoryData.availableStock,
        lastUpdated: new Date(inventoryData.lastUpdated),
      },
      session,
    );
    if (movementCtx && inventoryData.currentStock > 0) {
      await this.inventoryMovementService.createMovement(
        {
          medicineId: inventoryData.medicineId,
          batchId: movementCtx.batchId,
          movementType: movementCtx.movementType ?? "PURCHASE",
          quantity: inventoryData.currentStock,
          referenceId: movementCtx.referenceId,
          referenceType: movementCtx.referenceType ?? "PURCHASE",
          performedBy: movementCtx.performedBy,
          remarks: movementCtx.remarks,
        },
        session,
      );
    }
    return inventory;
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
    movementCtx: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const inventory = await this.inventoryRepo.findByMedicineId(medicineId);
    if (!inventory) {
      throw new Error("Inventory not found for the given medicineId");
    }

    inventory.currentStock += quantity;
    inventory.availableStock += quantity;
    inventory.lastUpdated = new Date();
    const update = await this.inventoryRepo.update(
      inventory._id.toString(),
      inventory,
      session,
    );

    await this.inventoryMovementService.createMovement(
      {
        medicineId: medicineId,
        batchId: movementCtx.batchId,
        movementType: movementCtx.movementType ?? "PURCHASE",
        quantity: quantity,
        referenceId: movementCtx.referenceId,
        referenceType: movementCtx.referenceType ?? "PURCHASE",
        performedBy: movementCtx.performedBy,
        remarks: movementCtx.remarks,
      },
      session,
    );
    return update;
  }

  async decreaseStock(
    medicineId: string,
    quantity: number,
    movementCtx: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const inventory = await this.inventoryRepo.findByMedicineId(medicineId);
    if (!inventory) {
      throw new Error("Inventory not found for the given medicineId");
    }
    if (inventory.availableStock < quantity) {
      throw new Error("Insufficient stock available");
    }
    inventory.currentStock -= quantity;
    inventory.availableStock -= quantity;
    inventory.lastUpdated = new Date();

    const updated = await this.inventoryRepo.update(
      inventory._id.toString(),
      inventory,
      session,
    );

    await this.inventoryMovementService.createMovement(
      {
        medicineId: medicineId,
        batchId: movementCtx.batchId,
        movementType: "SALE",
        quantity: quantity,
        referenceId: movementCtx.referenceId ?? "",
        referenceType: movementCtx.referenceType ?? "SALE",
        performedBy: movementCtx.performedBy,
        remarks: movementCtx.remarks ?? "Stock issued",
      },
      session,
    );

    return updated;
  }

  async reserveStock(
    medicineId: string,
    quantity: number,
    movementCtx: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const inventory = await this.inventoryRepo.findByMedicineId(medicineId);
    if (!inventory) {
      throw new Error("Inventory not found for the given medicineId");
    }
    if (inventory.availableStock < quantity) {
      throw new Error("Insufficient stock available to reserve");
    }
    inventory.availableStock -= quantity;
    inventory.lastUpdated = new Date();

    const updated = await this.inventoryRepo.update(
      inventory._id.toString(),
      inventory,
      session,
    );

    await this.inventoryMovementService.createMovement(
      {
        medicineId,
        batchId: movementCtx.batchId,
        movementType: movementCtx.movementType ?? "RESERVE",
        quantity,
        referenceId: movementCtx.referenceId,
        referenceType: movementCtx.referenceType ?? "RESERVE",
        performedBy: movementCtx.performedBy,
        remarks: movementCtx.remarks,
      },
      session,
    );

    return updated;
  }

  async releaseReservedStock(
    medicineId: string,
    quantity: number,
    movementCtx: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const inventory = await this.inventoryRepo.findByMedicineId(medicineId);
    if (!inventory) {
      throw new Error("Inventory not found for the given medicineId");
    }
    inventory.availableStock += quantity;
    inventory.lastUpdated = new Date();
    const updated = await this.inventoryRepo.update(
      inventory._id.toString(),
      inventory,
      session,
    );

    await this.inventoryMovementService.createMovement(
      {
        medicineId,
        batchId: movementCtx.batchId,
        movementType: movementCtx.movementType ?? "RELEASE",
        quantity,
        referenceId: movementCtx.referenceId,
        referenceType: movementCtx.referenceType ?? "RELEASE",
        performedBy: movementCtx.performedBy,
        remarks: movementCtx.remarks,
      },
      session,
    );

    return updated;
  }

  async syncInventoryFromBatch(
    medicineId: string,
    movementCtx?: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    let inventory = await this.inventoryRepo.findByMedicineId(medicineId);

    const totalStock = await this.batchRepo.getTotalStock(medicineId);

    if (!inventory) {
      const inventoryData = {
        medicineId: medicineId.toString(),
        currentStock: totalStock,
        reservedStock: 0,
        availableStock: totalStock - 0,
        lastUpdated: new Date().toISOString(),
      };
      return await this.createInventory(inventoryData, movementCtx, session);
    }

    const currentStock = totalStock;
    const availableStock = currentStock - inventory.reservedStock;

    const updated = await this.updateInventory(
      inventory._id.toString(),
      {
        currentStock,
        availableStock,
        lastUpdated: new Date(),
      },
      movementCtx,
      session,
    );

    return {
      ...updated,
      availableStock,
    };
  }

  async updateInventory(
    id: string,
    updateData: Partial<IInventory>,
    movementCtx?: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const before = movementCtx ? await this.inventoryRepo.findById(id) : null;
    const updated = await this.inventoryRepo.update(id, updateData, session);
    if (movementCtx && before && typeof updateData.currentStock === "number") {
      const delta = updateData.currentStock - before.currentStock;
      if (delta !== 0) {
        await this.inventoryMovementService.createMovement(
          {
            medicineId: before.medicineId.toString(),
            batchId: movementCtx.batchId,
            movementType: movementCtx.movementType ?? "ADJUSTMENT",
            quantity: Math.abs(delta),
            referenceId: movementCtx.referenceId,
            referenceType: movementCtx.referenceType ?? "ADJUSTMENT",
            performedBy: movementCtx.performedBy,
            remarks:
              movementCtx.remarks ??
              `Manual inventory adjustment of (${delta > 0 ? "+" : ""}${delta})`,
          },
          session,
        );
      }
    }
    return updated;
  }

  async deleteInventory(
    id: string,
    movementCtx?: ImovementCtx,
    session?: mongoose.ClientSession,
  ) {
    const before = movementCtx ? await this.inventoryRepo.findById(id) : null;

    const deleted = await this.inventoryRepo.delete(id, session);

    if (movementCtx && before && before.currentStock > 0) {
      await this.inventoryMovementService.createMovement(
        {
          medicineId: before.medicineId.toString(),
          batchId: movementCtx.batchId,
          movementType: "ADJUSTMENT",
          quantity: before.currentStock,
          referenceId: movementCtx.referenceId,
          referenceType: movementCtx.referenceType ?? "ADJUSTMENT",
          performedBy: movementCtx.performedBy,
          remarks: movementCtx.remarks ?? "Inventory record deleted",
        },
        session,
      );
    }

    return deleted;
  }
}
