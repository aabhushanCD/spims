// return.service.ts
import mongoose, { Types } from "mongoose";
import type { AppError } from "../../../shared/error.ts";
import type { ReturnRepo } from "../repo/return.repo.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";
import type { SalesRepo } from "../repo/sales.repo.ts";
import type { InventoryService } from "../../inventory/services/inventory.service.ts";

export interface ReturnItemInput {
  saleItemId: string;
  quantity: number;
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
    private readonly connection: mongoose.Connection,
  ) {}

  async createReturn(dto: CreateReturnDto) {
    if (!dto.items || dto.items.length === 0) {
      throw this.appError.badRequest("Return must include at least one item");
    }

    const sale = await this.salesRepo.findById(dto.salesId);
    if (!sale) {
      throw this.appError.notFound("Sale not found");
    }

    const soldItems = await this.saleItemRepo.findBySalesId(dto.salesId);
    const soldById = new Map(soldItems.map((i) => [i._id.toString(), i]));

    for (const returnItem of dto.items) {
      const soldItem = soldById.get(returnItem.saleItemId);
      if (!soldItem) {
        throw this.appError.badRequest(
          `Sale item ${returnItem.saleItemId} does not belong to sale ${dto.salesId}`,
        );
      }
      if (returnItem.quantity > soldItem.quantity) {
        throw this.appError.badRequest(
          `Cannot return ${returnItem.quantity} units of ${soldItem.medicineId} — only ${soldItem.quantity} were sold`,
        );
      }
      // NOTE: this doesn't account for partial returns already processed
      // against the same sale item across multiple Return records, since
      // that history isn't tracked anywhere. Add a returnItems schema field
      // and check cumulative returned qty here once it exists.
    }

    const session = await this.connection.startSession();
    try {
      let salesReturn;
      await session.withTransaction(async () => {
        salesReturn = await this.returnRepo.create({
          salesId: new Types.ObjectId(dto.salesId),
          returnReason: dto.returnReason,
          returnedBy: dto.returnedBy,
          returnDate: new Date(dto.returnDate),
        });

        for (const returnItem of dto.items) {
          const soldItem = soldById.get(returnItem.saleItemId)!;
          await this.inventoryService.increaseStock(
            soldItem.medicineId.toString(),
            returnItem.quantity,
            session,
          );
        }
      });

      return salesReturn;
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
