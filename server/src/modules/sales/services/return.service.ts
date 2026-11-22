import mongoose, { Types } from "mongoose";

import { calculateVat, roundCurrency } from "../../../shared/finance/money.ts";
import { getVatPercent } from "../../../config/vat.config.ts";
import type { PaymentService } from "../../payment/service/payment.service.ts";
import type { AppError } from "../../../shared/error.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { CounterRepository } from "../repo/counter.repo.ts";
import type { ReturnRepo } from "../repo/return.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type {
  ReturnCondition,
  ReturnItem,
  ReturnStatus,
} from "../types/return.type.ts";
import type { ReturnListQuery } from "../schema/return.schema.ts";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";
import {
  noopCacheInvalidator,
  type CacheInvalidator,
} from "../../../shared/provider/cacheInvalidator.ts";
import { logger } from "../../../shared/logger.ts";

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  condition: ReturnCondition;
  remarks?: string;
  restockingFee?: number;
}

export interface CreateReturnDto {
  salesId: string;
  returnReason: string;
  returnedBy: string;
  returnDate: Date | string;
  items: ReturnItemInput[];
  /** Authenticated user, used for movement attribution. */
  performedBy: string;
}

interface SaleItemPricing {
  unitPrice: number;
  quantity: number;
  discount: number;
}

interface SaleAllocation {
  /** Sum of VAT-exclusive line values before the invoice-level discount. */
  totalNet: number;
  /** Invoice-level discount derived from the stored sale totals. */
  invoiceDiscount: number;
}

export class ReturnService {
  constructor(
    private readonly returnRepo: ReturnRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly salesRepo: SalesRepo,
    private readonly inventoryService: InventoryService,
    private readonly appError: typeof AppError,
    private readonly counterRepo: CounterRepository,
    private readonly connection: mongoose.Connection,
    private readonly cacheInvalidator: CacheInvalidator = noopCacheInvalidator,
    private readonly paymentService?: PaymentService,
  ) {}

  private async invalidateDashboard(): Promise<void> {
    try {
      await this.cacheInvalidator.invalidateDashboard();
    } catch (error) {
      logger.warn("cache_invalidation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Merges duplicate request lines for the same sale item *and* condition.
   * Different conditions must stay separate so each produces its own stock
   * movement (GOOD restores stock; the others are write-offs).
   */
  private mergeReturnItems(items: ReturnItemInput[]): ReturnItemInput[] {
    const map = new Map<string, ReturnItemInput>();

    for (const item of items) {
      const key = `${item.saleItemId}::${item.condition}`;
      const existing = map.get(key);

      if (!existing) {
        map.set(key, { ...item });
        continue;
      }

      existing.quantity += item.quantity;

      const remarks = [existing.remarks, item.remarks].filter(
        (value): value is string => Boolean(value),
      );
      if (remarks.length > 0) {
        existing.remarks = [...new Set(remarks)].join("; ");
      }
    }

    return [...map.values()];
  }

  /**
   * The stored sale discount is `invoice discount + line discounts`. Deriving
   * the invoice-level part lets refunds apportion it across returned units so
   * they never exceed the net amount the customer actually paid.
   */
  private calculateSaleAllocation(
    sale: { discount?: number },
    saleItems: SaleItemPricing[],
  ): SaleAllocation {
    const totalLineDiscounts = roundCurrency(
      saleItems.reduce((sum, item) => sum + item.discount, 0),
    );
    const totalNet = Math.max(
      0,
      roundCurrency(
        saleItems.reduce(
          (sum, item) =>
            sum + roundCurrency(item.unitPrice * item.quantity - item.discount),
          0,
        ),
      ),
    );

    return {
      totalNet,
      invoiceDiscount: Math.min(
        totalNet,
        Math.max(0, roundCurrency((sale.discount ?? 0) - totalLineDiscounts)),
      ),
    };
  }

  private calculateLineRefund(
    soldItem: SaleItemPricing,
    quantity: number,
    allocation: SaleAllocation,
    vatPercent: number,
    restockingFee = 0,
  ): {
    discountShare: number;
    vat: number;
    refundAmount: number;
    restockingFee: number;
  } {
    const gross = roundCurrency(soldItem.unitPrice * quantity);
    const lineDiscountShare =
      soldItem.quantity > 0
        ? roundCurrency((soldItem.discount / soldItem.quantity) * quantity)
        : 0;
    const netBeforeInvoice = roundCurrency(gross - lineDiscountShare);

    // Allocate the invoice discount in proportion to this line's returned net.
    const invoiceDiscountShare =
      allocation.totalNet > 0
        ? Math.min(
            netBeforeInvoice,
            roundCurrency(
              allocation.invoiceDiscount *
                (netBeforeInvoice / allocation.totalNet),
            ),
          )
        : 0;

    const discountShare = roundCurrency(
      lineDiscountShare + invoiceDiscountShare,
    );
    const net = roundCurrency(gross - discountShare);
    const fee = roundCurrency(Math.max(0, restockingFee));

    if (fee > net) {
      throw this.appError.badRequest(
        "Restocking fee cannot exceed the line net value",
      );
    }

    const netAfterFee = roundCurrency(net - fee);
    const vat = calculateVat(netAfterFee, vatPercent / 100);

    return {
      discountShare,
      vat,
      restockingFee: fee,
      refundAmount: roundCurrency(netAfterFee + vat),
    };
  }

  async createReturn(dto: CreateReturnDto) {
    if (!dto.items.length) {
      throw this.appError.badRequest("Return must contain at least one item");
    }

    const session = await this.connection.startSession();

    try {
      let createdReturn: Awaited<ReturnType<ReturnRepo["create"]>> | undefined;

      await session.withTransaction(async () => {
        const mergedItems = this.mergeReturnItems(dto.items);

        const sale = await this.salesRepo.findById(dto.salesId, session);
        if (!sale) {
          throw this.appError.notFound("Sale not found");
        }

        const saleItems = await this.saleItemRepo.findBySalesId(
          dto.salesId,
          session,
        );
        if (!saleItems.length) {
          throw this.appError.badRequest("Sale has no items to return");
        }
        const saleMap = new Map(
          saleItems.map((item) => [item._id.toString(), item]),
        );

        const returnDate =
          dto.returnDate instanceof Date
            ? dto.returnDate
            : new Date(dto.returnDate);
        if (Number.isNaN(returnDate.getTime())) {
          throw this.appError.badRequest("Return date must be a valid date");
        }
        if (returnDate < sale.saleDate) {
          throw this.appError.badRequest(
            "Return date cannot be before sale date",
          );
        }

        const allocation = this.calculateSaleAllocation(sale, saleItems);
        const vatPercent = sale.vatRate ?? getVatPercent();

        const outstandingRows =
          await this.returnRepo.sumOutstandingBySaleItemIds(
            [...saleMap.keys()],
            session,
          );
        const outstanding = new Map(
          outstandingRows.map((row) => [row.saleItemId, row.quantity]),
        );

        const returnNumber =
          await this.counterRepo.generateReturnNumber(session);

        let refundTotal = 0;
        const returnItems: ReturnItem[] = [];
        const requestedBySaleItem = new Map<string, number>();

        for (const item of mergedItems) {
          const soldItem = saleMap.get(item.saleItemId);
          if (!soldItem) {
            throw this.appError.badRequest("Invalid Sale Item");
          }

          // Several condition lines can target the same sale item, so subtract
          // both other open returns and the lines already accepted here.
          const alreadyCommitted = outstanding.get(item.saleItemId) ?? 0;
          const alreadyRequested =
            requestedBySaleItem.get(item.saleItemId) ?? 0;
          const available =
            soldItem.quantity -
            soldItem.returnedQuantity -
            alreadyCommitted -
            alreadyRequested;
          if (item.quantity > available) {
            throw this.appError.badRequest(
              `Only ${Math.max(0, available)} items can be returned.`,
            );
          }
          requestedBySaleItem.set(
            item.saleItemId,
            alreadyRequested + item.quantity,
          );

          const restockingFee = item.restockingFee ?? 0;
          if (restockingFee > 0 && item.condition !== "GOOD") {
            throw this.appError.badRequest(
              "A restocking fee can only be applied to GOOD returns",
            );
          }

          const { discountShare, vat, refundAmount, restockingFee: fee } =
            this.calculateLineRefund(
              soldItem,
              item.quantity,
              allocation,
              vatPercent,
              restockingFee,
            );
          refundTotal += refundAmount;

          returnItems.push({
            saleItemId: soldItem._id,
            medicineId: soldItem.medicineId,
            batchId: soldItem.batchId,
            quantity: item.quantity,
            unitPrice: soldItem.unitPrice,
            vatRate: vatPercent,
            discount: discountShare,
            VAT: vat,
            restockingFee: fee,
            refundAmount,
            condition: item.condition,
            ...(item.remarks ? { remarks: item.remarks } : {}),
          });
        }

        createdReturn = await this.returnRepo.create(
          {
            salesId: sale._id,
            returnNumber,
            returnedBy: new Types.ObjectId(dto.returnedBy),
            status: "PENDING",
            returnReason: dto.returnReason,
            vatRate: vatPercent,
            refundAmount: roundCurrency(refundTotal),
            returnDate,
            returnItems,
          },
          session,
        );
      });

      return createdReturn;
    } finally {
      await session.endSession();
    }
  }

  private async transition(
    id: string,
    from: ReturnStatus,
    to: ReturnStatus,
    action: string,
  ) {
    const updated = await this.returnRepo.transitionStatus(id, from, to);
    if (!updated) {
      const exists = await this.returnRepo.findByIdRaw(id);
      if (!exists) {
        throw this.appError.notFound("Return not found");
      }
      throw this.appError.conflict(
        `Only ${from.toLowerCase()} returns can be ${action}`,
      );
    }
    return updated;
  }

  async approveReturn(id: string) {
    return await this.transition(id, "PENDING", "APPROVED", "approved");
  }

  async rejectReturn(id: string) {
    return await this.transition(id, "PENDING", "REJECTED", "rejected");
  }

  async cancelReturn(id: string) {
    return await this.transition(id, "PENDING", "CANCELLED", "cancelled");
  }

  /**
   * Applies the return: restores/writes off stock, increments the sale items'
   * returned quantity, recomputes the final refund, and closes the return.
   * Only APPROVED returns can be completed.
   */
  async completeReturn(id: string, performedBy: string) {
    if (!performedBy) {
      throw this.appError.unauthorized("Authenticated user required");
    }

    const session = await this.connection.startSession();

    try {
      let completedReturn:
        | Awaited<ReturnType<ReturnRepo["update"]>>
        | undefined;

      await session.withTransaction(async () => {
        const existing = await this.returnRepo.findByIdRaw(id, session);
        if (!existing) {
          throw this.appError.notFound("Return not found");
        }
        if (existing.status !== "APPROVED") {
          throw this.appError.conflict(
            "Only approved returns can be completed",
          );
        }
        if (!existing.returnItems.length) {
          throw this.appError.badRequest("Return has no items");
        }

        const salesId = existing.salesId.toString();
        const sale = await this.salesRepo.findById(salesId, session);
        if (!sale) {
          throw this.appError.notFound("Sale not found");
        }

        const saleItems = await this.saleItemRepo.findBySalesId(
          salesId,
          session,
        );
        const saleMap = new Map(
          saleItems.map((item) => [item._id.toString(), item]),
        );
        const returnedQtyAfter = new Map(
          saleItems.map((item) => [
            item._id.toString(),
            item.returnedQuantity,
          ]),
        );
        const allocation = this.calculateSaleAllocation(sale, saleItems);
        const vatPercent = existing.vatRate ?? sale.vatRate ?? getVatPercent();

        let refundTotal = 0;
        const finalItems: ReturnItem[] = [];
        const completingBySaleItem = new Map<string, number>();

        for (const line of existing.returnItems) {
          const saleItemId = line.saleItemId.toString();
          const soldItem = saleMap.get(saleItemId);
          if (!soldItem) {
            throw this.appError.badRequest("Invalid Sale Item");
          }

          // Multiple condition lines may target the same sale item; subtract
          // the quantity already accepted earlier in this same return.
          const alreadyCompleting =
            completingBySaleItem.get(saleItemId) ?? 0;
          const available =
            soldItem.quantity - soldItem.returnedQuantity - alreadyCompleting;
          if (line.quantity > available) {
            throw this.appError.badRequest(
              `Only ${Math.max(0, available)} items can be returned.`,
            );
          }
          completingBySaleItem.set(
            saleItemId,
            alreadyCompleting + line.quantity,
          );

          const remarks = line.remarks
            ? `Return ${existing.returnNumber}: ${line.remarks}`
            : `Return ${existing.returnNumber}`;

          await this.inventoryService.returnMedicine(
            soldItem.medicineId.toString(),
            soldItem.batchId.toString(),
            line.quantity,
            line.condition,
            {
              batchId: soldItem.batchId.toString(),
              movementType: "RETURN",
              referenceType: "SALES_RETURN",
              referenceId: existing._id.toString(),
              performedBy,
              remarks,
            },
            session,
          );

          const { discountShare, vat, refundAmount, restockingFee } =
            this.calculateLineRefund(
              soldItem,
              line.quantity,
              allocation,
              vatPercent,
              line.restockingFee ?? 0,
            );
          refundTotal += refundAmount;

          finalItems.push({
            saleItemId: soldItem._id,
            medicineId: soldItem.medicineId,
            batchId: soldItem.batchId,
            quantity: line.quantity,
            unitPrice: soldItem.unitPrice,
            vatRate: vatPercent,
            discount: discountShare,
            VAT: vat,
            restockingFee,
            refundAmount,
            condition: line.condition,
            ...(line.remarks ? { remarks: line.remarks } : {}),
          });

          const nextReturnedQuantity =
            (returnedQtyAfter.get(saleItemId) ?? soldItem.returnedQuantity) +
            line.quantity;

          await this.saleItemRepo.update(
            soldItem._id.toString(),
            { returnedQuantity: nextReturnedQuantity },
            session,
          );

          returnedQtyAfter.set(saleItemId, nextReturnedQuantity);
        }

        completedReturn = await this.returnRepo.update(
          id,
          {
            refundAmount: roundCurrency(refundTotal),
            status: "COMPLETED",
            vatRate: vatPercent,
            completedAt: new Date(),
            returnItems: finalItems,
          },
          session,
        );
        if (!completedReturn) {
          throw this.appError.conflict("Return changed while completing");
        }

        const fullyReturned = saleItems.every(
          (item) => item.quantity === returnedQtyAfter.get(item._id.toString()),
        );

        await this.salesRepo.update(
          salesId,
          { status: fullyReturned ? "RETURNED" : "PARTIALLY_RETURNED" },
          session,
        );

        if (this.paymentService && refundTotal > 0) {
          await this.paymentService.recordRefund(
            {
              saleId: sale._id,
              returnId: existing._id,
              amount: roundCurrency(refundTotal),
              method: sale.paymentMethod,
              performedBy,
            },
            session,
          );
        }
      });

      await this.invalidateDashboard();
      return completedReturn;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Reverses a completed return. GOOD stock is deducted again, returned
   * quantities are reduced, the refund is reversed in the payment ledger, and
   * the sale status is recomputed. Write-off lines never changed stock, so
   * only the returned quantity and refund are reversed for them.
   */
  async reverseReturn(id: string, performedBy: string, reason?: string) {
    if (!performedBy) {
      throw this.appError.unauthorized("Authenticated user required");
    }

    const session = await this.connection.startSession();

    try {
      let reversed:
        | Awaited<ReturnType<ReturnRepo["update"]>>
        | undefined;

      await session.withTransaction(async () => {
        const existing = await this.returnRepo.findByIdRaw(id, session);
        if (!existing) {
          throw this.appError.notFound("Return not found");
        }
        if (existing.status !== "COMPLETED" || existing.reversedAt) {
          throw this.appError.conflict(
            "Only completed, non-reversed returns can be reversed",
          );
        }

        const salesId = existing.salesId.toString();
        const sale = await this.salesRepo.findById(salesId, session);
        if (!sale) {
          throw this.appError.notFound("Sale not found");
        }
        const saleItems = await this.saleItemRepo.findBySalesId(
          salesId,
          session,
        );
        const saleMap = new Map(
          saleItems.map((item) => [item._id.toString(), item]),
        );
        const returnedQtyAfter = new Map(
          saleItems.map((item) => [
            item._id.toString(),
            item.returnedQuantity,
          ]),
        );

        for (const line of existing.returnItems) {
          const saleItemId = line.saleItemId.toString();
          const soldItem = saleMap.get(saleItemId);
          if (!soldItem) {
            throw this.appError.badRequest("Invalid Sale Item");
          }

          const currentReturned =
            returnedQtyAfter.get(saleItemId) ?? soldItem.returnedQuantity;
          if (currentReturned < line.quantity) {
            throw this.appError.conflict(
              "Returned quantity is lower than the return line",
            );
          }

          if (line.condition === "GOOD") {
            await this.inventoryService.decreaseStock(
              soldItem.medicineId.toString(),
              line.quantity,
              {
                batchId: soldItem.batchId.toString(),
                movementType: "ADJUSTMENT",
                referenceType: "SALES_RETURN",
                referenceId: existing._id.toString(),
                performedBy,
                remarks: `Return ${existing.returnNumber} reversed`,
              },
              session,
            );
          }

          await this.saleItemRepo.update(
            saleItemId,
            { returnedQuantity: currentReturned - line.quantity },
            session,
          );
          returnedQtyAfter.set(
            saleItemId,
            currentReturned - line.quantity,
          );
        }

        reversed = await this.returnRepo.update(
          id,
          {
            status: "REVERSED",
            reversedAt: new Date(),
            reversalReason: reason?.trim() || null,
          },
          session,
        );
        if (!reversed) {
          throw this.appError.conflict("Return changed while reversing");
        }

        if (this.paymentService && existing.refundAmount > 0) {
          await this.paymentService.recordRefundReversal(
            {
              saleId: sale._id,
              returnId: existing._id,
              amount: existing.refundAmount,
              method: sale.paymentMethod,
              performedBy,
            },
            session,
          );
        }

        const fullyReversed = saleItems.every(
          (item) => (returnedQtyAfter.get(item._id.toString()) ?? 0) === 0,
        );
        await this.salesRepo.update(
          salesId,
          { status: fullyReversed ? "COMPLETED" : "PARTIALLY_RETURNED" },
          session,
        );
      });

      await this.invalidateDashboard();
      return reversed;
    } finally {
      await session.endSession();
    }
  }

  async getReturnById(id: string) {
    const salesReturn = await this.returnRepo.findById(id);
    if (!salesReturn) {
      throw this.appError.notFound("Return not found");
    }
    return salesReturn;
  }

  async getAllReturns(status?: ReturnStatus) {
    return await this.returnRepo.findAll(status);
  }

  async getReturnsPage(query: ReturnListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.returnRepo.findPage(
      {
        ...(query.status ? { status: query.status } : {}),
        ...(query.salesId ? { salesId: query.salesId } : {}),
        ...(query.search ? { search: query.search } : {}),
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

  async updateReturn(
    id: string,
    updateData: Partial<{ returnReason: string }>,
  ) {
    const existing = await this.returnRepo.findByIdRaw(id);
    if (!existing) {
      throw this.appError.notFound("Return not found");
    }
    if (existing.status !== "PENDING") {
      throw this.appError.conflict(
        "Only pending returns can be updated",
      );
    }

    const updated = await this.returnRepo.update(id, updateData);
    if (!updated) {
      throw this.appError.notFound("Return not found");
    }
    return updated;
  }
}
