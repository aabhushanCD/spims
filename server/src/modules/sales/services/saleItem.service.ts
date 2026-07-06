// saleItem.service.ts
import type { AppError } from "../../../shared/error.ts";
import type { SaleItemRepo } from "../repo/saleItem.repo.ts";

export class SaleItemService {
  constructor(
    private readonly saleItemRepo: SaleItemRepo,
    private readonly appError: typeof AppError,
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

  // Exposed for admin correction tools only — normal flow creates/deletes
  // items exclusively through SalesService so stock stays in sync.
  async update(
    id: string,
    updateData: Partial<{ unitPrice: number; discount: number }>,
  ) {
    const updated = await this.saleItemRepo.update(id, updateData);
    if (!updated) {
      throw this.appError.notFound("Sale item not found");
    }
    return updated;
  }
}
