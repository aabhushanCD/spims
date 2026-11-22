// saleItem.service.ts
import type mongoose from "mongoose";

import { calculateVat, roundCurrency } from "../../../shared/finance/money.ts";
import { getVatPercent } from "../../../config/vat.config.ts";
import type { AppError } from "../../../shared/error.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";

export class SaleItemService {
  constructor(
    private readonly saleItemRepo: SaleItemRepo,
    private readonly salesRepo: SalesRepo,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

  async getById(id: string) {
    const item = await this.saleItemRepo.findById(id);
    if (!item) {
      throw this.appError.notFound("Sale item not found");
    }
    return item;
  }

  async getBySalesId(salesId: string) {
    return await this.saleItemRepo.findBySalesId(salesId);
  }

  async getAll() {
    return await this.saleItemRepo.findAll();
  }

  /**
   * Admin price/discount correction. Recomputes the corrected line's
   * `totalPrice` and the parent sale's totals in one transaction. The
   * invoice-level discount is derived from the stored sale total and the
   * pre-correction line discounts so it is preserved across corrections.
   */
  async update(
    id: string,
    updateData: Partial<{ unitPrice: number; discount: number }>,
  ) {
    const session = await this.connection.startSession();

    try {
      let updatedItem: Awaited<ReturnType<SaleItemRepo["update"]>> | undefined;

      await session.withTransaction(async () => {
        const item = await this.saleItemRepo.findById(id, session);
        if (!item) {
          throw this.appError.notFound("Sale item not found");
        }
        if (item.returnedQuantity > 0) {
          throw this.appError.conflict(
            "Cannot correct a sale item after it has been returned",
          );
        }

        const salesId = item.salesId.toString();
        const sale = await this.salesRepo.findById(salesId, session);
        if (!sale) {
          throw this.appError.notFound("Sale not found");
        }

        const items = await this.saleItemRepo.findBySalesId(salesId, session);

        const oldLineDiscounts = roundCurrency(
          items.reduce((sum, line) => sum + line.discount, 0),
        );
        const invoiceDiscount = Math.max(
          0,
          roundCurrency(sale.discount - oldLineDiscounts),
        );

        const unitPrice = updateData.unitPrice ?? item.unitPrice;
        const discount = roundCurrency(updateData.discount ?? item.discount);
        const lineTotal = roundCurrency(unitPrice * item.quantity);

        if (discount > lineTotal) {
          throw this.appError.badRequest(
            "Discount cannot exceed the corrected line total",
          );
        }

        updatedItem = await this.saleItemRepo.update(
          id,
          {
            unitPrice,
            discount,
            totalPrice: roundCurrency(lineTotal - discount),
          },
          session,
        );
        if (!updatedItem) {
          throw this.appError.conflict("Sale item changed while correcting");
        }

        const correctedItems = items.map((line) =>
          line._id.toString() === id
            ? {
                ...line,
                unitPrice,
                discount,
                totalPrice: roundCurrency(lineTotal - discount),
              }
            : line,
        );

        const subtotal = roundCurrency(
          correctedItems.reduce(
            (sum, line) =>
              sum + roundCurrency(line.unitPrice * line.quantity),
            0,
          ),
        );
        const lineDiscounts = roundCurrency(
          correctedItems.reduce((sum, line) => sum + line.discount, 0),
        );
        const taxable = roundCurrency(
          subtotal - lineDiscounts - invoiceDiscount,
        );

        if (taxable < 0) {
          throw this.appError.badRequest(
            "Correction would make the sale total negative",
          );
        }

        const vat = calculateVat(
          taxable,
          (sale.vatRate ?? getVatPercent()) / 100,
        );

        const updatedSale = await this.salesRepo.update(
          salesId,
          {
            subTotal: subtotal,
            discount: roundCurrency(invoiceDiscount + lineDiscounts),
            VAT: vat,
            totalAmount: roundCurrency(taxable + vat),
          },
          session,
        );
        if (!updatedSale) {
          throw this.appError.conflict(
            "Sale changed while correcting the sale item",
          );
        }
      });

      return updatedItem;
    } finally {
      await session.endSession();
    }
  }
}
