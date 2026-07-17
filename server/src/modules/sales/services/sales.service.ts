// sales.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { CounterRepository } from "../repo/counter.repo.ts";
import type { CreateSaleDto } from "../schema/sales.schema.ts";

const VAT_RATE = 0.13; // Nepal standard VAT — move to config if this can vary

export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly inventoryService: InventoryService,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly counterRepo: CounterRepository,
    private readonly appError: typeof AppError,

    private readonly connection: mongoose.Connection,
  ) {}
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

    dto.items = this.mergeDuplicateItems(dto.items);

    const session = await this.connection.startSession();

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
          const lineTotal = allocation.unitPrice * allocation.quantity;

          const lineDiscount = (lineTotal * item.discountPercentage) / 100;

          subtotal += lineTotal;

          totalDiscount += lineDiscount;

          await this.saleItemRepo.create(
            {
              salesId: sale._id,

              medicineId: new Types.ObjectId(allocation.medicineId),

              batchId: new Types.ObjectId(allocation.batchId),

              quantity: allocation.quantity,

              unitPrice: allocation.unitPrice,

              discount: lineDiscount,

              totalPrice: lineTotal - lineDiscount,
            },
            session,
          );
        }
      }

      const invoiceDiscount = dto.discount ?? 0;

      if (invoiceDiscount < 0) {
        throw this.appError.badRequest("Invalid discount");
      }

      if (invoiceDiscount > subtotal) {
        throw this.appError.badRequest("Discount exceeds subtotal");
      }

      const taxable = subtotal - totalDiscount - invoiceDiscount;

      const vat = Math.round(taxable * 0.13 * 100) / 100;

      const total = taxable + vat;

      await this.salesRepo.update(
        sale._id.toString(),

        {
          subTotal: subtotal,

          discount: invoiceDiscount + totalDiscount,

          VAT: vat,

          totalAmount: total,
        },

        session,
      );
    });

    return await this.salesRepo.findById(sale!._id.toString(), session);
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
        const items = await this.saleItemRepo.findBySalesId(id, session);

        for (const item of items) {
          await this.inventoryService.increaseStock(
            item.medicineId.toString(),
            item.quantity,
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
      return deleted;
    } finally {
      await session.endSession();
    }
  }
}
