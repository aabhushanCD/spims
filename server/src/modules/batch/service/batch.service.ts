import type mongoose from "mongoose";
import { Types } from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import type {
  StockMovementCtx,
  StockMovementType,
} from "../../inventory/types/stockMovement.type.ts";
import type { StockMutationService } from "../../inventory/services/stockMutation.service.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.js";
import type { SaleItemRepo } from "../../sales/repo/saleItem.repo.js";
import type { IBatch } from "../model/medicineBatch.model.js";
import type { MedicineBatchRepo } from "../repo/medicineBatch.repo.js";
import type { InventoryMovementRepo } from "../../inventory/repo/inventoryMovement.repo.ts";
import type { BatchListQuery } from "../schema/batch.schema.ts";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";

export interface CreateBatchInput {
  purchaseOrderId: string;
  medicineId: string;
  batchNumber: string;
  expiryDate: Date | string;
  manufacturingDate: Date | string;
  purchasePrice: number;
  sellingPrice: number;
  quantityReceived: number;
  quantityRemaining?: number;
}

export type UpdateBatchInput = Partial<
  Pick<
    IBatch,
    | "batchNumber"
    | "expiryDate"
    | "manufacturingDate"
    | "purchasePrice"
    | "sellingPrice"
    | "quantityRemaining"
    | "isActive"
  >
>;

export type BatchMovementCtx = Omit<StockMovementCtx, "medicineId">;

export class BatchService {
  constructor(
    private readonly batchRepo: MedicineBatchRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly stockMutation: StockMutationService,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
    private readonly movementRepo?: InventoryMovementRepo,
  ) {}

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

  private withMedicine(
    medicineId: string,
    ctx: BatchMovementCtx,
  ): StockMovementCtx {
    return { ...ctx, medicineId };
  }

  private requirePerformedBy(ctx: BatchMovementCtx): string {
    if (!ctx.performedBy) {
      throw this.appError.badRequest(
        "movementCtx.performedBy is required for stock mutations",
      );
    }
    return ctx.performedBy;
  }

  private parseDate(value: Date | string, label: string): Date {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw this.appError.badRequest(`${label} must be a valid date`);
    }
    return date;
  }

  async createBatch(
    input: CreateBatchInput,
    session?: mongoose.ClientSession,
    movementCtx?: BatchMovementCtx,
  ): Promise<IBatch> {
    if (!movementCtx) {
      throw this.appError.badRequest("movementCtx is required for createBatch");
    }
    this.requirePerformedBy(movementCtx);

    if (!Number.isInteger(input.quantityReceived) || input.quantityReceived <= 0) {
      throw this.appError.badRequest(
        "quantityReceived must be a positive whole number",
      );
    }
    if (
      input.quantityRemaining !== undefined &&
      input.quantityRemaining !== input.quantityReceived
    ) {
      throw this.appError.badRequest(
        "New batches must start with quantityRemaining equal to quantityReceived",
      );
    }

    const expiryDate = this.parseDate(input.expiryDate, "expiryDate");
    const manufacturingDate = this.parseDate(
      input.manufacturingDate,
      "manufacturingDate",
    );
    if (expiryDate <= manufacturingDate) {
      throw this.appError.badRequest(
        "Expiry date must be greater than manufacturing date",
      );
    }

    return this.runInSession(session, async (activeSession) => {
      const purchaseOrder = await this.purchaseOrderRepo.findById(
        input.purchaseOrderId,
        activeSession,
      );
      if (!purchaseOrder) {
        throw this.appError.notFound("Purchase order not found");
      }

      const batchData: Partial<IBatch> = {
        ...input,
        medicineId: new Types.ObjectId(input.medicineId),
        purchaseOrderId: new Types.ObjectId(input.purchaseOrderId),
        expiryDate,
        manufacturingDate,
        quantityRemaining: input.quantityReceived,
      };

      const batch = await this.batchRepo.create(batchData, activeSession);
      await this.stockMutation.receiveStock({
        medicineId: input.medicineId,
        batchId: batch._id.toString(),
        quantity: input.quantityReceived,
        ctx: this.withMedicine(input.medicineId, {
          ...movementCtx,
          batchId: batch._id.toString(),
        }),
        session: activeSession,
      });
      return batch;
    });
  }

  async getBatchById(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    return batch;
  }

  async getAllBatches(session?: mongoose.ClientSession): Promise<IBatch[]> {
    return await this.batchRepo.findAll(session);
  }

  async getBatchesPage(query: BatchListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.batchRepo.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.medicineId ? { medicineId: query.medicineId } : {}),
        ...(query.purchaseOrderId
          ? { purchaseOrderId: query.purchaseOrderId }
          : {}),
        ...(query.isExpired !== undefined ? { isExpired: query.isExpired } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        ...(query.expiringInDays !== undefined
          ? { expiringInDays: query.expiringInDays }
          : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.createdAt,
      (row) => String(row._id),
    );
  }

  /** True when a purchase order has already produced batches. */
  async hasBatchesForPurchaseOrder(
    purchaseOrderId: string,
  ): Promise<boolean> {
    return await this.batchRepo.existsByPurchaseOrderId(purchaseOrderId);
  }

  async getAvailableBatches(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const batches = await this.batchRepo.findAllByMedicineId(
      medicineId,
      session,
    );
    return batches.filter(
      (batch) =>
        batch.quantityRemaining > 0 &&
        batch.expiryDate > new Date() &&
        !batch.isExpired,
    );
  }

  async updateBatch(
    batchId: string,
    updateData: UpdateBatchInput,
    session?: mongoose.ClientSession,
    movementCtx?: BatchMovementCtx,
  ): Promise<IBatch> {
    const allowedFields = new Set<keyof UpdateBatchInput>([
      "batchNumber",
      "expiryDate",
      "manufacturingDate",
      "purchasePrice",
      "sellingPrice",
      "quantityRemaining",
      "isActive",
    ]);
    for (const key of Object.keys(updateData) as (keyof UpdateBatchInput)[]) {
      if (!allowedFields.has(key)) {
        throw this.appError.badRequest(`Field ${key} cannot be updated`);
      }
    }

    if (updateData.quantityRemaining !== undefined) {
      const quantity = updateData.quantityRemaining;
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw this.appError.badRequest(
          "quantityRemaining must be a non-negative whole number",
        );
      }
    }

    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }

    if (
      updateData.quantityRemaining !== undefined &&
      updateData.quantityRemaining > batch.quantityReceived
    ) {
      throw this.appError.badRequest(
        "quantityRemaining cannot exceed quantityReceived",
      );
    }

    if (updateData.isActive === false) {
      const remaining = updateData.quantityRemaining ?? batch.quantityRemaining;
      if (remaining !== 0) {
        throw this.appError.badRequest(
          "Batch can only be marked as inactive if quantity remaining is zero",
        );
      }
    }

    if (updateData.expiryDate || updateData.manufacturingDate) {
      const expiry = this.parseDate(
        updateData.expiryDate ?? batch.expiryDate,
        "expiryDate",
      );
      const manufacturing = this.parseDate(
        updateData.manufacturingDate ?? batch.manufacturingDate,
        "manufacturingDate",
      );
      if (expiry <= manufacturing) {
        throw this.appError.badRequest(
          "Expiry date must be greater than manufacturing date",
        );
      }
    }

    const medicineId = batch.medicineId.toString();
    const quantityChanged =
      updateData.quantityRemaining !== undefined &&
      updateData.quantityRemaining !== batch.quantityRemaining;

    if (quantityChanged) {
      if (!movementCtx) {
        throw this.appError.badRequest(
          "movementCtx is required when changing batch quantity",
        );
      }
      this.requirePerformedBy(movementCtx);
    }

    return this.runInSession(session, async (activeSession) => {
      const { quantityRemaining, ...otherFields } = updateData;
      if (Object.keys(otherFields).length > 0) {
        const updatedOtherFields = await this.batchRepo.update(
          batchId,
          otherFields,
          activeSession,
        );
        if (!updatedOtherFields) {
          throw this.appError.conflict("Batch changed while being updated");
        }
      }

      let updated: IBatch | null;
      if (quantityChanged && quantityRemaining !== undefined && movementCtx) {
        const result = await this.stockMutation.setBatchStock({
          medicineId,
          batchId,
          newQuantity: quantityRemaining,
          ctx: this.withMedicine(medicineId, movementCtx),
          session: activeSession,
        });
        updated = result.batch;
      } else {
        updated = await this.batchRepo.update(
          batchId,
          quantityRemaining === undefined ? {} : { quantityRemaining },
          activeSession,
        );
      }

      if (!updated) {
        throw this.appError.conflict("Batch changed while being updated");
      }

      if (updateData.expiryDate && !quantityChanged) {
        await this.stockMutation.syncAggregate(medicineId, {
          session: activeSession,
        });
      }

      return updated;
    });
  }

  async deleteBatch(
    batchId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (batch.quantityRemaining > 0) {
      throw this.appError.conflict("Cannot delete a batch with stock");
    }
    // Deletion would erase the cost basis for historical COGS and make an
    // approved GOOD return impossible because there is no batch to restore to.
    if (await this.saleItemRepo.existsByBatchId(batchId, session)) {
      throw this.appError.conflict(
        "Cannot delete a batch referenced by sales; COGS and returns depend on it",
      );
    }
    if (this.movementRepo && (await this.movementRepo.existsByBatchId(batchId))) {
      throw this.appError.conflict(
        "Cannot delete a batch with inventory movement history",
      );
    }
    const deleted = await this.batchRepo.delete(batchId, session);
    if (!deleted) {
      throw this.appError.conflict("Batch changed while being deleted");
    }
    return deleted;
  }

  async deductQuantity(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
    movementCtx?: BatchMovementCtx,
  ): Promise<IBatch> {
    return this.mutateBatch(
      batchId,
      quantity,
      session,
      movementCtx,
      "ADJUSTMENT",
      (input) => this.stockMutation.decreaseBatchStock(input),
    );
  }

  async increaseQuantity(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
    movementCtx?: BatchMovementCtx,
  ): Promise<IBatch> {
    return this.mutateBatch(
      batchId,
      quantity,
      session,
      movementCtx,
      "PURCHASE",
      (input) => this.stockMutation.increaseBatchStock(input),
    );
  }

  async adjustStock(
    batchId: string,
    quantity: number,
    session?: mongoose.ClientSession,
    movementCtx?: BatchMovementCtx,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (!movementCtx) {
      throw this.appError.badRequest(
        "movementCtx is required when adjusting batch quantity",
      );
    }
    this.requirePerformedBy(movementCtx);

    const result = await this.stockMutation.setBatchStock({
      medicineId: batch.medicineId.toString(),
      batchId,
      newQuantity: quantity,
      ctx: this.withMedicine(batch.medicineId.toString(), movementCtx),
      session,
    });
    return result.batch;
  }

  private async mutateBatch(
    batchId: string,
    quantity: number,
    session: mongoose.ClientSession | undefined,
    movementCtx: BatchMovementCtx | undefined,
    movementType: StockMovementType,
    mutate: (input: {
      medicineId: string;
      batchId: string;
      quantity: number;
      ctx: StockMovementCtx;
      session?: mongoose.ClientSession | undefined;
    }) => Promise<{ batch: IBatch }>,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    if (!movementCtx) {
      throw this.appError.badRequest(
        "movementCtx is required for batch stock mutations",
      );
    }
    this.requirePerformedBy(movementCtx);

    const result = await mutate({
      medicineId: batch.medicineId.toString(),
      batchId,
      quantity,
      ctx: this.withMedicine(batch.medicineId.toString(), {
        ...movementCtx,
        movementType,
      }),
      session,
    });
    return result.batch;
  }

  async markExpiredBatches(
    session?: mongoose.ClientSession,
  ): Promise<{ batchId: string; medicineId: string }[]> {
    const now = new Date();
    const batches = await this.batchRepo.findExpiredCandidates(now, session);
    const newlyExpired: { batchId: string; medicineId: string }[] = [];
    const affectedMedicineIds = new Set<string>();

    for (const batch of batches) {
      const updated = await this.batchRepo.update(
        batch._id.toString(),
        { isExpired: true },
        session,
      );
      if (!updated) {
        continue;
      }
      const medicineId = batch.medicineId.toString();
      newlyExpired.push({
        batchId: batch._id.toString(),
        medicineId,
      });
      affectedMedicineIds.add(medicineId);
    }

    // Flagging expiry removes stock from the sellable set. Reconcile the
    // aggregate immediately instead of leaving it inflated until the next
    // unrelated stock mutation.
    for (const medicineId of affectedMedicineIds) {
      await this.stockMutation.syncAggregate(medicineId, { session });
    }

    return newlyExpired;
  }

  async getExpiredBatches(session?: mongoose.ClientSession): Promise<IBatch[]> {
    return await this.batchRepo.findExpired(new Date(), session);
  }

  async confirmDisposal(
    batchId: string,
    performedBy: string,
    remarks?: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch> {
    if (!performedBy) {
      throw this.appError.badRequest("performedBy is required for disposal");
    }

    return this.runInSession(session, async (activeSession) => {
      const batch = await this.batchRepo.findById(batchId, activeSession);
      if (!batch) {
        throw this.appError.notFound("Batch not found");
      }
      if (!batch.isExpired) {
        throw this.appError.badRequest(
          "Batch is not marked as expired — cannot dispose",
        );
      }
      if (batch.quantityRemaining <= 0) {
        throw this.appError.badRequest(
          "Batch has no remaining quantity to dispose",
        );
      }

      const result = await this.stockMutation.writeOffBatchStock({
        medicineId: batch.medicineId.toString(),
        batchId,
        quantity: batch.quantityRemaining,
        ctx: {
          medicineId: batch.medicineId.toString(),
          batchId,
          referenceId: batchId,
          referenceType: "ADJUSTMENT",
          movementType: "EXPIRED",
          performedBy,
          remarks: remarks ?? `Disposal confirmed for expired batch ${batch.batchNumber}`,
        },
        session: activeSession,
      });
      return result.batch;
    });
  }

  async getExpiredAwaitingDisposal(
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    return await this.batchRepo.findExpiredAwaitingDisposal(session);
  }

  async getLowStockBatches(
    threshold: number,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    return await this.batchRepo.findLowStock(threshold, session);
  }

  async getBatchesByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch[]> {
    const batches = await this.batchRepo.findAllByMedicineId(
      medicineId,
      session,
    );
    if (batches.length === 0) {
      throw this.appError.notFound(
        "Batch not found for the given medicineId",
      );
    }
    return batches;
  }

  async getBatchByMedicineId(
    medicineId: string,
    session?: mongoose.ClientSession,
  ): Promise<IBatch> {
    const batch = await this.batchRepo.findByMedicineId(medicineId, session);
    if (!batch) {
      throw this.appError.notFound(
        "Batch not found for the given medicineId",
      );
    }
    return batch;
  }

  async getBatchHistory(batchId: string, session?: mongoose.ClientSession) {
    const batch = await this.batchRepo.findById(batchId, session);
    if (!batch) {
      throw this.appError.notFound("Batch not found");
    }
    const movements = this.movementRepo
      ? await this.movementRepo.findByBatchIdPage(batchId, 100)
      : [];
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
      movements,
    };
  }
}
