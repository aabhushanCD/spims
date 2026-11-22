import mongoose from "mongoose";

import type { AppError } from "../../../shared/error.ts";
import { buildPage, decodeCursor } from "../../../shared/pagination/cursor.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { CounterRepository } from "../../sales/repo/counter.repo.ts";
import type { PurchaseReturnRepo } from "../repo/purchaseReturn.repo.ts";
import type { SupplierLedgerRepo } from "../repo/supplierLedger.repo.ts";
import type {
  CreatePurchaseReturnDto,
  PurchaseReturnListQuery,
} from "../schema/purchaseReturn.schema.ts";
import type { PurchaseReturnItem } from "../model/purchaseReturn.model.ts";
import { roundCurrency } from "../../../shared/finance/money.ts";

export class PurchaseReturnService {
  constructor(
    private readonly returnRepo: PurchaseReturnRepo,
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly inventoryService: InventoryService,
    private readonly counterRepo: CounterRepository,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
    private readonly ledgerRepo?: SupplierLedgerRepo,
  ) {}

  async create(dto: CreatePurchaseReturnDto, performedBy: string) {
    if (!dto.items.length) {
      throw this.appError.badRequest("Return must contain at least one item");
    }

    const session = await this.connection.startSession();
    try {
      let created: Awaited<ReturnType<PurchaseReturnRepo["create"]>> | undefined;

      await session.withTransaction(async () => {
        const purchaseOrder = await this.purchaseOrderRepo.findById(
          dto.purchaseOrderId,
          session,
        );
        if (!purchaseOrder) {
          throw this.appError.notFound("Purchase order not found");
        }
        if (purchaseOrder.status !== "received") {
          throw this.appError.badRequest(
            "Only received purchase orders can be returned",
          );
        }

        const merged = new Map<string, number>();
        for (const line of dto.items) {
          merged.set(
            line.batchId,
            (merged.get(line.batchId) ?? 0) + line.quantity,
          );
        }

        const items: PurchaseReturnItem[] = [];
        let refundTotal = 0;

        for (const [batchId, quantity] of merged) {
          const batch = await this.batchRepo.findById(batchId, session);
          if (!batch) {
            throw this.appError.notFound("Batch not found");
          }
          if (
            !batch.purchaseOrderId ||
            batch.purchaseOrderId.toString() !== dto.purchaseOrderId
          ) {
            throw this.appError.badRequest(
              "Batch does not belong to the purchase order",
            );
          }
          if (quantity > batch.quantityRemaining) {
            throw this.appError.badRequest(
              `Only ${batch.quantityRemaining} units remain in batch ${batch.batchNumber}`,
            );
          }

          const unitCost = roundCurrency(batch.purchasePrice);
          const refundAmount = roundCurrency(unitCost * quantity);
          refundTotal += refundAmount;
          items.push({
            batchId: batch._id,
            medicineId: batch.medicineId,
            quantity,
            unitCost,
            refundAmount,
          });
        }

        const returnNumber =
          await this.counterRepo.generatePurchaseReturnNumber(session);
        created = await this.returnRepo.create(
          {
            purchaseOrderId: purchaseOrder._id,
            supplierId: purchaseOrder.supplierId,
            returnNumber,
            status: "PENDING",
            returnReason: dto.returnReason,
            returnedBy: new mongoose.Types.ObjectId(performedBy),
            returnDate: dto.returnDate,
            refundAmount: roundCurrency(refundTotal),
            items,
          },
          session,
        );
      });

      return created;
    } finally {
      await session.endSession();
    }
  }

  private async transition(
    id: string,
    from: "PENDING",
    to: "APPROVED" | "REJECTED" | "CANCELLED",
  ) {
    const existing = await this.returnRepo.findByIdRaw(id);
    if (!existing) {
      throw this.appError.notFound("Purchase return not found");
    }
    if (existing.status !== from) {
      throw this.appError.conflict(
        `Only pending purchase returns can be ${to.toLowerCase()}`,
      );
    }
    const updated = await this.returnRepo.transition(id, from, to);
    if (!updated) {
      throw this.appError.conflict(
        "Purchase return changed while transitioning",
      );
    }
    return updated;
  }

  async approve(id: string) {
    return await this.transition(id, "PENDING", "APPROVED");
  }

  async reject(id: string) {
    return await this.transition(id, "PENDING", "REJECTED");
  }

  async cancel(id: string) {
    return await this.transition(id, "PENDING", "CANCELLED");
  }

  async complete(id: string, performedBy: string) {
    if (!performedBy) {
      throw this.appError.unauthorized("Authenticated user required");
    }

    const session = await this.connection.startSession();
    try {
      let completed:
        | Awaited<ReturnType<PurchaseReturnRepo["update"]>>
        | undefined;

      await session.withTransaction(async () => {
        const existing = await this.returnRepo.findByIdRaw(id, session);
        if (!existing) {
          throw this.appError.notFound("Purchase return not found");
        }
        if (existing.status !== "APPROVED") {
          throw this.appError.conflict(
            "Only approved purchase returns can be completed",
          );
        }

        for (const line of existing.items) {
          await this.inventoryService.decreaseStock(
            line.medicineId.toString(),
            line.quantity,
            {
              batchId: line.batchId.toString(),
              movementType: "PURCHASE_RETURN",
              referenceType: "PURCHASE_RETURN",
              referenceId: existing._id.toString(),
              performedBy,
              remarks: `Purchase return ${existing.returnNumber}`,
            },
            session,
          );
        }

        if (
          this.ledgerRepo &&
          !(await this.ledgerRepo.hasForReturn(id))
        ) {
          const currentBalance = await this.ledgerRepo.getBalance(
            existing.supplierId.toString(),
          );
          await this.ledgerRepo.create(
            {
              supplierId: existing.supplierId,
              purchaseReturnId: existing._id,
              type: "CREDIT",
              amount: existing.refundAmount,
              balanceAfter: roundCurrency(
                currentBalance + existing.refundAmount,
              ),
              reference: existing.returnNumber,
              createdBy: new mongoose.Types.ObjectId(performedBy),
            },
            session,
          );
        }

        completed = await this.returnRepo.update(
          id,
          { status: "COMPLETED", completedAt: new Date() },
          session,
        );
        if (!completed) {
          throw this.appError.conflict(
            "Purchase return changed while completing",
          );
        }
      });

      return completed;
    } finally {
      await session.endSession();
    }
  }

  async getSupplierLedger(supplierId: string) {
    if (!this.ledgerRepo) {
      throw this.appError.notFound("Supplier ledger is unavailable");
    }
    const [entries, balance] = await Promise.all([
      this.ledgerRepo.findBySupplier(supplierId),
      this.ledgerRepo.getBalance(supplierId),
    ]);
    return { supplierId, balance: roundCurrency(balance), entries };
  }

  async getById(id: string) {
    const doc = await this.returnRepo.findById(id);
    if (!doc) {
      throw this.appError.notFound("Purchase return not found");
    }
    return doc;
  }

  async getPage(query: PurchaseReturnListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.returnRepo.findPage(
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.supplierId ? { supplierId: query.supplierId } : {}),
        ...(query.purchaseOrderId
          ? { purchaseOrderId: query.purchaseOrderId }
          : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.returnDate,
      (row) => String(row._id),
    );
  }
}
