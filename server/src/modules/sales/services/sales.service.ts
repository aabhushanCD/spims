// sales.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";

const VAT_RATE = 0.13; // Nepal standard VAT — move to config if this can vary

export interface SaleItemInput {
  medicineId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface CreateSaleDto {
  invoiceNumber: string;
  customerName: string;
  paymentMethod: string;
  saleDate: string;
  cashierId: string;
  items: SaleItemInput[];
  overallDiscount?: number; // discount applied on top of subtotal, if any
}

export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly inventoryService: InventoryService,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly appError: typeof AppError,
    private readonly connection: mongoose.Connection,
  ) {}

  async createSale(dto: CreateSaleDto) {
    if (!dto.items || dto.items.length === 0) {
      throw this.appError.badRequest("Sale must include at least one item");
    }

    const session = await this.connection.startSession();
    try {
      let sale;
      await session.withTransaction(async () => {
        const itemTotals = dto.items.map((item) => {
          const discount = item.discount ?? 0;
          const totalPrice = item.quantity * item.unitPrice - discount;
          if (totalPrice < 0) {
            throw this.appError.badRequest(
              `Discount exceeds line total for medicine ${item.medicineId}`,
            );
          }
          return { ...item, discount, totalPrice };
        });

        const subTotal = itemTotals.reduce((sum, i) => sum + i.totalPrice, 0);
        const overallDiscount = dto.overallDiscount ?? 0;
        const taxableAmount = subTotal - overallDiscount;
        const VAT = Math.round(taxableAmount * VAT_RATE * 100) / 100;
        const totalAmount = taxableAmount + VAT;

        sale = await this.salesRepo.create(
          {
            invoiceNumber: dto.invoiceNumber,
            customerName: dto.customerName,
            subTotal,
            VAT,
            discount: overallDiscount,
            totalAmount,
            paymentMethod: dto.paymentMethod,
            cashierId: new Types.ObjectId(dto.cashierId),
            saleDate: new Date(dto.saleDate),
          },
          session,
        );

        for (const item of itemTotals) {
          const batch = await this.batchRepo.findById(item.batchId);
          if (!batch) {
            throw this.appError.notFound(`Batch not found: ${item.batchId}`);
          }
          if (batch.medicineId.toString() !== item.medicineId) {
            throw this.appError.badRequest(
              `Batch ${item.batchId} does not belong to medicine ${item.medicineId}`,
            );
          }

          await this.saleItemRepo.create(
            {
              salesId: sale._id,
              batchId: new Types.ObjectId(item.batchId),
              medicineId: new Types.ObjectId(item.medicineId),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              totalPrice: item.totalPrice,
            },
            session,
          );

          // decreaseStock validates availableStock internally and throws
          // if insufficient — that failure will abort the whole transaction.
          await this.inventoryService.decreaseStock(
            item.medicineId,
            item.quantity,
            {
              batchId: item.batchId,
              referenceId: sale._id.toString(),
              referenceType: "SALE",
              movementType: "SALE",
              performedBy: dto.cashierId,
              remarks: `Sale ${dto.invoiceNumber}`,
            },
            session,
          );
        }
      });

      return sale;
    } finally {
      await session.endSession();
    }
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
