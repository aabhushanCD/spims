import mongoose from "mongoose";
import type { IStockAdjustment } from "../model/stockAdjustment.model.ts";
import type { StockAdjustmentRepo } from "../repo/stockAdjustment.repo.ts";
import { AppError } from "../../../shared/error.ts";

export class StockAdjustmentService {
  constructor(private readonly stockAdjustmentRepo: StockAdjustmentRepo) {}

  async adjustStock(
    medicineId: string,
    newQuantity: number,
    reason: string,
    userId: string,
  ) {
    const stockAdjustmentData: Partial<IStockAdjustment> = {
      medicineId: new mongoose.Types.ObjectId(medicineId),
      quantityAfter: newQuantity,
      reason,
      adjustedBy: new mongoose.Types.ObjectId(userId),
      adjustedAt: new Date(),
    };
    return await this.stockAdjustmentRepo.create(stockAdjustmentData);
  }

  async getAdjustments(medicineId: string) {
    return this.stockAdjustmentRepo.findByMedicineId(medicineId);
  }

  async reverseAdjustment(adjustmentId: string) {
    const adjustment = await this.stockAdjustmentRepo.findById(adjustmentId);
    if (!adjustment) {
      throw AppError.notFound("Stock adjustment not found");
    }
    const reversedAdjustmentData: Partial<IStockAdjustment> = {
      medicineId: adjustment.medicineId,
      quantityBefore: adjustment.quantityAfter,
      quantityAfter: adjustment.quantityBefore,
      reason: `Reversal of adjustment: ${adjustment.reason}`,
      adjustedBy: adjustment.adjustedBy,
      adjustedAt: new Date(),
    };
    return await this.stockAdjustmentRepo.create(reversedAdjustmentData);
  }
}
