// return.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { ReturnRepo } from "../repo/return.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";
import type { CounterRepository } from "../repo/counter.repo.ts";
import type { ReturnItem } from "../types/return.type.ts";

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
  condition: "GOOD" | "DAMAGED" | "EXPIRED" | "OPENED";
}

export interface CreateReturnDto {
  salesId: string;
  returnReason: string;
  returnedBy: string;
  returnDate: string;

  items: ReturnItemInput[]; // NOT persisted — schema has no field for this, see note below
  performedBy: string; // for movement attribution
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
  ) {}

  private mergeReturnItems(items: ReturnItemInput[]) {
    const map = new Map<string, ReturnItemInput>();

    for (const item of items) {
      const existing = map.get(item.saleItemId);

      if (!existing) {
        map.set(item.saleItemId, { ...item });
        continue;
      }

      existing.quantity += item.quantity;
    }

    return [...map.values()];
  }

  async createReturn(dto: CreateReturnDto) {
    if (!dto.items.length) {
      throw this.appError.badRequest("Return must contain at least one item");
    }

    const session = await this.connection.startSession();

    try {
      let createdReturn;

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
        const saleMap = new Map(
          saleItems.map((item) => [item._id.toString(), item]),
        );

        // tracks post-return quantities locally so the fully-returned check
        // below reflects what THIS transaction is doing, not stale pre-return data
        const returnedQtyAfter = new Map(
          saleItems.map((item) => [item._id.toString(), item.returnedQuantity]),
        );

        const returnNumber =
          await this.counterRepo.generateReturnNumber(session);

        const returnDate = new Date(dto.returnDate);

        if (returnDate < sale.saleDate) {
          throw this.appError.badRequest(
            "Return date cannot be before sale date",
          );
        }

        // create the parent return record first so its _id is available
        // as referenceId on each stock movement below
        const salesReturn = await this.returnRepo.create(
          {
            salesId: sale._id,
            returnNumber,
            returnedBy: new Types.ObjectId(dto.returnedBy),
            status: "PENDING",
            returnReason: dto.returnReason,
            refundAmount: 0,
            returnDate,
            returnItems: [] as ReturnItem[],
          },
          session,
        );

        let refundTotal = 0;
        const returnItems: ReturnItem[] = [];

        for (const item of mergedItems) {
          const soldItem = saleMap.get(item.saleItemId);
          if (!soldItem) {
            throw this.appError.badRequest("Invalid Sale Item");
          }

          const available = soldItem.quantity - soldItem.returnedQuantity;
          if (item.quantity > available) {
            throw this.appError.badRequest(
              `Only ${available} items can be returned.`,
            );
          }

          await this.inventoryService.returnMedicine(
            soldItem.medicineId.toString(),
            soldItem.batchId.toString(),
            item.quantity,
            item.condition,
            {
              batchId: soldItem.batchId.toString(),
              movementType: "RETURN",
              referenceType: "SALES_RETURN",
              referenceId: salesReturn._id.toString(),
              performedBy: dto.returnedBy,
              remarks: `Return ${returnNumber}`,
            },
            session,
          );

          const lineTotal = soldItem.unitPrice * item.quantity;

          const discountPerUnit = soldItem.discount / soldItem.quantity;

          const refund = lineTotal - discountPerUnit * item.quantity;
          refundTotal += refund;

          returnItems.push({
            saleItemId: soldItem._id,
            medicineId: soldItem.medicineId,
            batchId: soldItem.batchId,
            quantity: item.quantity,
            unitPrice: soldItem.unitPrice,
            discount: soldItem.discount,
            refundAmount: refund,
            condition: item.condition,
          });

          await this.saleItemRepo.update(
            soldItem._id.toString(),
            { returnedQuantity: soldItem.returnedQuantity + item.quantity },
            session,
          );

          returnedQtyAfter.set(
            soldItem._id.toString(),
            soldItem.returnedQuantity + item.quantity,
          );
        }

        await this.returnRepo.update(
          salesReturn._id.toString(),
          {
            refundAmount: refundTotal,
            status: "COMPLETED",
            returnItems,
          },
          session,
        );

        const fullyReturned = saleItems.every(
          (si) => si.quantity === returnedQtyAfter.get(si._id.toString()),
        );

        await this.salesRepo.update(
          sale._id.toString(),
          { status: fullyReturned ? "RETURNED" : "PARTIALLY_RETURNED" },
          session,
        );

        createdReturn = await this.returnRepo.findById(
          salesReturn._id.toString(),
          session,
        );
      });

      return createdReturn;
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

  async getAllReturns() {
    return await this.returnRepo.findAll();
  }

  async updateReturn(
    id: string,
    updateData: Partial<{ returnReason: string }>,
  ) {
    const updated = await this.returnRepo.update(id, updateData);
    if (!updated) {
      throw this.appError.notFound("Return not found");
    }
    return updated;
  }
}
