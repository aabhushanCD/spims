import mongoose, { Types } from "mongoose";

import { isDuplicateKeyError } from "../../../shared/utils/mongoError.ts";
import type { AppError } from "../../../shared/error.ts";
import {
  noopCacheInvalidator,
  type CacheInvalidator,
} from "../../../shared/provider/cacheInvalidator.ts";
import { logger } from "../../../shared/logger.ts";
import type { IBatch } from "../../batch/model/medicineBatch.model.js";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.js";
import type { IInventory } from "../model/inventory.model.js";
import type { InventoryRepo } from "../repo/inventory.repo.js";
import type {
  StockMovementCtx,
  StockMovementType,
} from "../types/stockMovement.type.ts";
import type { InventoryMovementService } from "./inventoryMovement.service.ts";

export type {
  StockMovementCtx,
  StockReferenceType,
  StockMovementType,
} from "../types/stockMovement.type.ts";

export interface BatchMutationInput {
  medicineId: string;
  batchId: string;
  ctx: StockMovementCtx;
  session?: mongoose.ClientSession | undefined;
  sync?: boolean | undefined;
}

export interface AggregateMutationInput {
  medicineId: string;
  ctx: StockMovementCtx;
  session?: mongoose.ClientSession | undefined;
}

export interface SyncAggregateOptions {
  ctx?: StockMovementCtx | undefined;
  session?: mongoose.ClientSession | undefined;
}

export interface BatchMutationResult {
  batch: IBatch;
  inventory?: IInventory | undefined;
}

export class StockMutationService {
  constructor(
    private readonly inventoryRepo: InventoryRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
    private readonly cacheInvalidator: CacheInvalidator = noopCacheInvalidator,
  ) {}

  private async invalidateStockCaches(medicineId: string): Promise<void> {
    try {
      await Promise.all([
        this.cacheInvalidator.invalidateDashboard(),
        this.cacheInvalidator.invalidateReorder(medicineId),
      ]);
    } catch (error) {
      // Cache invalidation is best-effort; a successful stock change must not
      // be reported as a failure because Redis was unavailable.
      logger.warn("stock_cache_invalidation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async runInSession<T>(
    session: mongoose.ClientSession | undefined,
    callback: (activeSession: mongoose.ClientSession) => Promise<T>,
  ): Promise<T> {
    if (session) {
      return callback(session);
    }

    const ownedSession = await this.connection.startSession();
    try {
      let result!: T;
      await ownedSession.withTransaction(async () => {
        result = await callback(ownedSession);
      });
      return result;
    } finally {
      await ownedSession.endSession();
    }
  }

  private requirePositiveQuantity(quantity: number, label = "Quantity"): void {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw this.appError.badRequest(`${label} must be greater than zero`);
    }
  }

  private requireWholeNumber(value: number, label: string): void {
    if (!Number.isInteger(value)) {
      throw this.appError.badRequest(`${label} must be a whole number`);
    }
  }

  private async loadBatchForMedicine(
    medicineId: string,
    batchId: string,
    session: mongoose.ClientSession | undefined,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (batch.medicineId.toString() !== medicineId) {
      throw this.appError.badRequest("Batch does not belong to medicine");
    }
    return batch;
  }

  private withBatchId(ctx: StockMovementCtx, batchId: string): StockMovementCtx {
    return { ...ctx, batchId };
  }

  async recordMovement(
    ctx: StockMovementCtx,
    quantity: number,
    session?: mongoose.ClientSession,
  ): Promise<void> {
    this.requirePositiveQuantity(quantity);
    this.requireWholeNumber(quantity, "Quantity");
    await this.runInSession(session, async (activeSession) => {
      await this.inventoryMovementService.createMovement(
        {
          medicineId: ctx.medicineId,
          batchId: ctx.batchId,
          quantity,
          movementType: ctx.movementType,
          referenceId: ctx.referenceId,
          referenceType: ctx.referenceType,
          performedBy: ctx.performedBy,
          remarks: ctx.remarks ?? "",
        },
        activeSession,
      );
    });
    await this.invalidateStockCaches(ctx.medicineId);
  }

  async syncAggregate(
    medicineId: string,
    opts: SyncAggregateOptions = {},
  ): Promise<IInventory> {
    const result = await this.runInSession(opts.session, async (activeSession) => {
      const inventory = await this.inventoryRepo.findByMedicineId(
        medicineId,
        activeSession,
      );
      const totalStock = await this.batchRepo.getTotalStock(
        medicineId,
        activeSession,
      );

      if (!inventory) {
        let created: IInventory;
        try {
          created = await this.inventoryRepo.create(
            {
              medicineId: new Types.ObjectId(medicineId),
              currentStock: totalStock,
              reservedStock: 0,
              availableStock: totalStock,
              lastUpdated: new Date(),
            },
            activeSession,
          );
        } catch (error) {
          if (isDuplicateKeyError(error)) {
            throw this.appError.conflict(
              "Inventory already exists for this medicine",
            );
          }
          throw error;
        }

        if (opts.ctx && totalStock > 0) {
          await this.recordMovement(opts.ctx, totalStock, activeSession);
        }
        return created;
      }

      // Reservations are advisory. If batch truth fell below outstanding
      // reservations, reconcile by clamping rather than persisting a negative
      // availableStock value.
      const reservedStock = Math.max(
        0,
        Math.min(inventory.reservedStock, totalStock),
      );
      const availableStock = totalStock - reservedStock;
      const delta = totalStock - inventory.currentStock;

      let updated = inventory;
      if (
        inventory.currentStock !== totalStock ||
        inventory.reservedStock !== reservedStock ||
        inventory.availableStock !== availableStock
      ) {
        const result = await this.inventoryRepo.updateWithVersion(
          inventory._id.toString(),
          inventory.version ?? 0,
          {
            currentStock: totalStock,
            reservedStock,
            availableStock,
            lastUpdated: new Date(),
          },
          activeSession,
        );
        if (!result) {
          throw this.appError.conflict(
            "Inventory changed while reconciling stock",
          );
        }
        updated = result;
      }

      if (opts.ctx && delta !== 0) {
        await this.recordMovement(
          opts.ctx,
          Math.abs(delta),
          activeSession,
        );
      }

      return updated;
    });

    await this.invalidateStockCaches(medicineId);
    return result;
  }

  async initializeAggregate(input: {
    medicineId: string;
    reservedStock: number;
    ctx?: StockMovementCtx | undefined;
    session?: mongoose.ClientSession | undefined;
  }): Promise<IInventory> {
    this.requireWholeNumber(input.reservedStock, "reservedStock");
    if (input.reservedStock < 0) {
      throw this.appError.badRequest(
        "reservedStock must be a non-negative number",
      );
    }

    const result = await this.runInSession(input.session, async (activeSession) => {
      const totalStock = await this.batchRepo.getTotalStock(
        input.medicineId,
        activeSession,
      );
      if (input.reservedStock > totalStock) {
        throw this.appError.badRequest(
          "reservedStock cannot exceed available batch stock",
        );
      }

      let created: IInventory;
      try {
        created = await this.inventoryRepo.create(
          {
            medicineId: new Types.ObjectId(input.medicineId),
            currentStock: totalStock,
            reservedStock: input.reservedStock,
            availableStock: totalStock - input.reservedStock,
            lastUpdated: new Date(),
          },
          activeSession,
        );
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw this.appError.conflict(
            "Inventory already exists for this medicine",
          );
        }
        throw error;
      }

      if (input.ctx && totalStock > 0) {
        await this.recordMovement(input.ctx, totalStock, activeSession);
      }
      return created;
    });

    await this.invalidateStockCaches(input.medicineId);
    return result;
  }

  async receiveStock(
    input: BatchMutationInput & { quantity: number },
  ): Promise<BatchMutationResult> {
    this.requirePositiveQuantity(input.quantity, "Received quantity");
    this.requireWholeNumber(input.quantity, "Received quantity");
    return this.runInSession(input.session, async (activeSession) => {
      const batch = await this.loadBatchForMedicine(
        input.medicineId,
        input.batchId,
        activeSession,
      );
      const inventory = await this.syncAggregate(input.medicineId, {
        session: activeSession,
      });
      await this.recordMovement(
        this.withBatchId(input.ctx, input.batchId),
        input.quantity,
        activeSession,
      );
      return { batch, inventory };
    });
  }

  async increaseBatchStock(
    input: BatchMutationInput & { quantity: number },
  ): Promise<BatchMutationResult> {
    this.requirePositiveQuantity(input.quantity);
    this.requireWholeNumber(input.quantity, "Quantity");

    return this.runInSession(input.session, async (activeSession) => {
      const batch = await this.loadBatchForMedicine(
        input.medicineId,
        input.batchId,
        activeSession,
      );
      if (batch.quantityRemaining + input.quantity > batch.quantityReceived) {
        throw this.appError.conflict(
          "Increase would exceed the original received quantity",
        );
      }

      const updatedBatch = await this.batchRepo.increaseBatchStock(
        input.batchId,
        input.quantity,
        batch.quantityRemaining,
        activeSession,
      );
      if (!updatedBatch) {
        throw this.appError.conflict("Unable to increase batch stock");
      }

      const inventory =
        input.sync === false
          ? undefined
          : await this.syncAggregate(input.medicineId, {
              session: activeSession,
            });
      await this.recordMovement(
        this.withBatchId(input.ctx, input.batchId),
        input.quantity,
        activeSession,
      );
      return { batch: updatedBatch, inventory };
    });
  }

  async decreaseBatchStock(
    input: BatchMutationInput & { quantity: number },
  ): Promise<BatchMutationResult> {
    this.requirePositiveQuantity(input.quantity);
    this.requireWholeNumber(input.quantity, "Quantity");

    return this.runInSession(input.session, async (activeSession) => {
      await this.loadBatchForMedicine(
        input.medicineId,
        input.batchId,
        activeSession,
      );
      const updatedBatch = await this.batchRepo.deductBatchStock(
        input.batchId,
        input.quantity,
        activeSession,
      );
      if (!updatedBatch) {
        throw this.appError.conflict("Insufficient batch stock");
      }

      const inventory =
        input.sync === false
          ? undefined
          : await this.syncAggregate(input.medicineId, {
              session: activeSession,
            });
      await this.recordMovement(
        this.withBatchId(input.ctx, input.batchId),
        input.quantity,
        activeSession,
      );
      return { batch: updatedBatch, inventory };
    });
  }

  async setBatchStock(
    input: BatchMutationInput & { newQuantity: number },
  ): Promise<BatchMutationResult> {
    this.requireWholeNumber(input.newQuantity, "Quantity");
    if (input.newQuantity < 0) {
      throw this.appError.badRequest(
        "Quantity must be a non-negative number",
      );
    }

    return this.runInSession(input.session, async (activeSession) => {
      const batch = await this.loadBatchForMedicine(
        input.medicineId,
        input.batchId,
        activeSession,
      );
      if (input.newQuantity > batch.quantityReceived) {
        throw this.appError.badRequest(
          "Quantity cannot exceed the original received quantity",
        );
      }

      const delta = input.newQuantity - batch.quantityRemaining;
      const updatedBatch = await this.batchRepo.setBatchStock(
        input.batchId,
        batch.quantityRemaining,
        input.newQuantity,
        activeSession,
      );
      if (!updatedBatch) {
        throw this.appError.conflict("Unable to update batch stock");
      }

      const inventory =
        input.sync === false
          ? undefined
          : await this.syncAggregate(input.medicineId, {
              session: activeSession,
            });
      if (delta !== 0) {
        await this.recordMovement(
          this.withBatchId(input.ctx, input.batchId),
          Math.abs(delta),
          activeSession,
        );
      }
      return { batch: updatedBatch, inventory };
    });
  }

  async writeOffBatchStock(
    input: BatchMutationInput & { quantity: number },
  ): Promise<BatchMutationResult> {
    this.requirePositiveQuantity(input.quantity);
    this.requireWholeNumber(input.quantity, "Quantity");

    return this.runInSession(input.session, async (activeSession) => {
      const batch = await this.loadBatchForMedicine(
        input.medicineId,
        input.batchId,
        activeSession,
      );
      if (input.quantity !== batch.quantityRemaining) {
        throw this.appError.badRequest(
          "Write-off quantity must equal the remaining batch stock",
        );
      }

      const updatedBatch = await this.batchRepo.setBatchStock(
        input.batchId,
        batch.quantityRemaining,
        0,
        activeSession,
      );
      if (!updatedBatch) {
        throw this.appError.conflict("Unable to write off batch stock");
      }

      const inventory =
        input.sync === false
          ? undefined
          : await this.syncAggregate(input.medicineId, {
              session: activeSession,
            });
      await this.recordMovement(
        this.withBatchId(input.ctx, input.batchId),
        input.quantity,
        activeSession,
      );
      return { batch: updatedBatch, inventory };
    });
  }

  async reserveStock(
    input: AggregateMutationInput & { quantity: number },
  ): Promise<IInventory> {
    this.requirePositiveQuantity(input.quantity);
    this.requireWholeNumber(input.quantity, "Quantity");

    return this.runInSession(input.session, async (activeSession) => {
      const current = await this.syncAggregate(input.medicineId, {
        session: activeSession,
      });
      if (current.availableStock < input.quantity) {
        throw this.appError.badRequest(
          "Insufficient stock available to reserve",
        );
      }

      const updated = await this.inventoryRepo.updateWithVersion(
        current._id.toString(),
        current.version ?? 0,
        {
          reservedStock: current.reservedStock + input.quantity,
          availableStock: current.availableStock - input.quantity,
          lastUpdated: new Date(),
        },
        activeSession,
      );
      if (!updated) {
        throw this.appError.conflict("Inventory changed while reserving stock");
      }

      await this.recordMovement(
        { ...input.ctx, movementType: "RESERVE" as StockMovementType },
        input.quantity,
        activeSession,
      );
      return updated;
    });
  }

  async releaseStock(
    input: AggregateMutationInput & { quantity: number },
  ): Promise<IInventory> {
    this.requirePositiveQuantity(input.quantity);
    this.requireWholeNumber(input.quantity, "Quantity");

    return this.runInSession(input.session, async (activeSession) => {
      const current = await this.syncAggregate(input.medicineId, {
        session: activeSession,
      });
      if (current.reservedStock < input.quantity) {
        throw this.appError.badRequest(
          "Cannot release more than the reserved quantity",
        );
      }

      const updated = await this.inventoryRepo.updateWithVersion(
        current._id.toString(),
        current.version ?? 0,
        {
          reservedStock: current.reservedStock - input.quantity,
          availableStock: current.availableStock + input.quantity,
          lastUpdated: new Date(),
        },
        activeSession,
      );
      if (!updated) {
        throw this.appError.conflict(
          "Inventory changed while releasing reserved stock",
        );
      }

      await this.recordMovement(
        { ...input.ctx, movementType: "RELEASE" as StockMovementType },
        input.quantity,
        activeSession,
      );
      return updated;
    });
  }
}
