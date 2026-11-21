// sales.service.ts
import mongoose, { Types } from "mongoose";
import { calculateVat, roundCurrency } from "../../../shared/finance/money.ts";
import type { AppError } from "../../../shared/error.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { ReturnRepo } from "../repo/return.repo.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { CounterRepository } from "../repo/counter.repo.ts";
import type {
  CreateSaleDto,
  SalesListQuery,
} from "../schema/sales.schema.ts";
import {
  buildPage,
  decodeCursor,
} from "../../../shared/pagination/cursor.ts";
import {
  noopCacheInvalidator,
  type CacheInvalidator,
} from "../../../shared/provider/cacheInvalidator.ts";
import { isDuplicateKeyError } from "../../../shared/utils/mongoError.ts";
import { logger } from "../../../shared/logger.ts";

export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly inventoryService: InventoryService,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly counterRepo: CounterRepository,
    private readonly returnRepo: ReturnRepo,
    private readonly appError: typeof AppError,

    private readonly connection: mongoose.Connection,
    private readonly cacheInvalidator: CacheInvalidator = noopCacheInvalidator,
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
  private mergeDuplicateItems(items: CreateSaleDto["items"]) {
    const map = new Map<string, (typeof items)[number]>();

    for (const item of items) {
      const existing = map.get(item.medicineId);

      if (!existing) {
        map.set(item.medicineId, { ...item });
        continue;
      }

      existing.quantity += item.quantity;

      existing.discountPercentage = Math.max(
        existing.discountPercentage,
        item.discountPercentage,
      );
    }

    return [...map.values()];
  }
  async createSale(dto: CreateSaleDto) {
    if (!dto.items.length) {
      throw this.appError.badRequest("Cart is empty");
    }

    if (dto.idempotencyKey) {
      const existing = await this.salesRepo.findByIdempotencyKey(
        dto.idempotencyKey,
        dto.cashierId,
      );
      if (existing) {
        return existing;
      }
    }

    dto.items = this.mergeDuplicateItems(dto.items);

    const session = await this.connection.startSession();

    try {
      try {
        const sale = await this.runCreateSaleTransaction(dto, session);
        const saved = await this.salesRepo.findById(
          sale._id.toString(),
          session,
        );
        await this.invalidateDashboard();
        return saved;
      } catch (error) {
        // A concurrent request with the same key may have won the unique
        // index race. Its transaction committed a complete sale, so return it
        // instead of failing the client with a 500.
        if (dto.idempotencyKey && isDuplicateKeyError(error)) {
          const existing = await this.salesRepo.findByIdempotencyKey(
            dto.idempotencyKey,
            dto.cashierId,
          );
          if (existing) {
            return existing;
          }
        }
        throw error;
      }
    } finally {
      await session.endSession();
    }
  }

  private async runCreateSaleTransaction(
    dto: CreateSaleDto,
    session: mongoose.ClientSession,
  ) {
    let sale;

    await session.withTransaction(async () => {
      const invoiceNumber =
        await this.counterRepo.generateInvoiceNumber(session);
      sale = await this.salesRepo.create(
        {
          invoiceNumber,

          cashierId: new Types.ObjectId(dto.cashierId),

          customerName: dto.customerName,

          paymentMethod: dto.paymentMethod,

          saleDate: dto.saleDate,

          status: "COMPLETED",

          ...(dto.idempotencyKey
            ? { idempotencyKey: dto.idempotencyKey }
            : {}),

          subTotal: 0,

          discount: 0,

          VAT: 0,

          totalAmount: 0,
        },
        session,
      );

      let subtotal = 0;

      let totalDiscount = 0;

      for (const item of dto.items) {
        const allocations = await this.inventoryService.sellMedicine(
          item.medicineId,

          item.quantity,

          {
            batchId: "",

            referenceId: sale._id.toString(),

            referenceType: "SALE",

            movementType: "SALE",

            performedBy: dto.cashierId,

            remarks: `Sale ${invoiceNumber}`,
          },

          session,
        );

        for (const allocation of allocations) {
          const lineTotal = roundCurrency(
            allocation.unitPrice * allocation.quantity,
          );

          const lineDiscount = roundCurrency(
            (lineTotal * item.discountPercentage) / 100,
          );

          subtotal += lineTotal;

          totalDiscount += lineDiscount;

          await this.saleItemRepo.create(
            {
              salesId: sale._id,

              medicineId: new Types.ObjectId(allocation.medicineId),

              batchId: new Types.ObjectId(allocation.batchId),

              quantity: allocation.quantity,

              unitPrice: allocation.unitPrice,

              purchasePrice: allocation.purchasePrice,

              discount: lineDiscount,

              totalPrice: roundCurrency(lineTotal - lineDiscount),
            },
            session,
          );
        }
      }

      const invoiceDiscount = roundCurrency(dto.discount ?? 0);

      if (invoiceDiscount < 0) {
        throw this.appError.badRequest("Invalid discount");
      }

      const discountedSubtotal = roundCurrency(subtotal - totalDiscount);

      if (invoiceDiscount > discountedSubtotal) {
        throw this.appError.badRequest(
          "Discount exceeds the discounted subtotal",
        );
      }

      const taxable = roundCurrency(discountedSubtotal - invoiceDiscount);

      const vat = calculateVat(taxable);

      const total = roundCurrency(taxable + vat);

      await this.salesRepo.update(
        sale._id.toString(),

        {
          subTotal: roundCurrency(subtotal),

          discount: roundCurrency(invoiceDiscount + totalDiscount),

          VAT: vat,

          totalAmount: total,
        },

        session,
      );
    });

    return sale!;
  }

  async getSaleById(id: string) {
    const sale = await this.salesRepo.findById(id);
    if (!sale) {
      throw this.appError.notFound("Sale not found");
    }
    const items = await this.saleItemRepo.findBySalesId(id);
    return { ...sale, items };
  }

  async getAllSales() {
    return await this.salesRepo.findAll();
  }

  async getSalesPage(query: SalesListQuery) {
    const cursor = query.cursor ? decodeCursor(query.cursor) : null;
    const rows = await this.salesRepo.findPage(
      {
        ...(query.search ? { search: query.search } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.cashierId ? { cashierId: query.cashierId } : {}),
        ...(query.from ? { from: query.from } : {}),
        ...(query.to ? { to: query.to } : {}),
      },
      cursor,
      query.limit + 1,
    );
    return buildPage(
      rows,
      query.limit,
      (row) => row.saleDate,
      (row) => String(row._id),
    );
  }

  // Deliberately narrow: only non-financial, non-stock fields should be
  // editable post-creation. Changing quantities/prices after the fact
  // should go through a return + new sale, not a silent edit.
  async updateSale(
    id: string,
    updateData: Partial<{ customerName: string; paymentMethod: string }>,
  ) {
    const updated = await this.salesRepo.update(id, updateData);
    if (!updated) {
      throw this.appError.notFound("Sale not found");
    }
    return updated;
  }

  // Deleting a sale reverses its stock impact. Consider whether you want
  // this at all once a sale is finalized — many POS systems disallow hard
  // delete entirely and require a Return instead.
  async deleteSale(id: string, performedBy: string) {
    const session = await this.connection.startSession();
    try {
      let deleted;
      await session.withTransaction(async () => {
        const sale = await this.salesRepo.findById(id, session);
        if (!sale) {
          throw this.appError.notFound("Sale not found");
        }
        if (await this.returnRepo.hasActiveBySale(id, session)) {
          throw this.appError.conflict(
            "Cannot delete a sale with returns; reverse the return first",
          );
        }
        const items = await this.saleItemRepo.findBySalesId(id, session);

        for (const item of items) {
          const restorable = item.quantity - (item.returnedQuantity ?? 0);
          if (restorable <= 0) {
            await this.saleItemRepo.delete(item._id.toString(), session);
            continue;
          }

          await this.inventoryService.increaseStock(
            item.medicineId.toString(),
            restorable,
            {
              batchId: item.batchId.toString(),
              referenceId: id,
              referenceType: "SALE",
              performedBy,
              movementType: "RETURN",
              remarks: `Sale ${sale.invoiceNumber} deleted — stock restored`,
            },
            session,
          );
          await this.saleItemRepo.delete(item._id.toString(), session);
        }

        deleted = await this.salesRepo.delete(id, session);
      });
      await this.invalidateDashboard();
      return deleted;
    } finally {
      await session.endSession();
    }
  }
}
