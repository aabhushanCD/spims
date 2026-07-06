import type { AppError } from "../../../shared/error.ts";
import type { SmartReorderRepo } from "../repo/smartReorder.repo.ts";
import type { BatchService } from "../../batch/service/batch.service.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";

export interface CreateSmartReorderDto {
  medicineId: string;
  suggestedQuantity: number; // matches model's typo — rename together if you fix the schema
  confidenceScore: number;
  recommendationReason: string;
}

export class SmartReorderService {
  constructor(
    private readonly smartReorderRepo: SmartReorderRepo,
    private readonly batchService: BatchService,
    private readonly medicineRepo: MedicineRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createRecommendation(dto: CreateSmartReorderDto) {
    const medicine = await this.medicineRepo.findById(dto.medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }
    if (dto.suggestedQuantity <= 0) {
      throw this.appError.badRequest(
        "suggestedQuantity must be greater than zero",
      );
    }
    if (dto.confidenceScore < 0 || dto.confidenceScore > 1) {
      throw this.appError.badRequest("confidenceScore must be between 0 and 1");
    }

    return await this.smartReorderRepo.create({
      medicineId: dto.medicineId,
      suggestedQuantity: dto.suggestedQuantity,
      confidenceScore: dto.confidenceScore,
      recommendationReason: dto.recommendationReason,
      generatedAt: new Date(),
      status: "PENDING",
    } as any);
  }

  // Placeholder heuristic ONLY: flags medicines currently in low-stock
  // batches and suggests restocking to a fixed threshold. This is NOT
  // demand-based forecasting — there's no sales-velocity data source wired
  // in yet. Replace suggestedQuantity's calculation once you have a
  // reliable average-usage figure (e.g. from SaleItemRepo aggregation).
  async generateRecommendationForMedicine(
    medicineId: string,
    threshold = 10,
    targetStock = 50,
  ) {
    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }

    const lowStockBatches =
      await this.batchService.getLowStockBatches(threshold);
    const relevant = lowStockBatches.filter(
      (b) => b.medicineId.toString() === medicineId,
    );

    const currentTotal = relevant.reduce(
      (sum, b) => sum + b.quantityRemaining,
      0,
    );
    const suggestedQuantity = Math.max(targetStock - currentTotal, 0);

    if (suggestedQuantity === 0) {
      throw this.appError.badRequest("Medicine is not currently low on stock");
    }

    return await this.smartReorderRepo.create({
      medicineId,
      suggestedQuantity,
      confidenceScore: 0.5, // placeholder — no real model behind this yet
      recommendationReason: `Stock (${currentTotal}) below threshold (${threshold}); suggested top-up to ${targetStock}`,
      generatedAt: new Date(),
      status: "PENDING",
    } as any);
  }

  async getById(id: string) {
    const reorder = await this.smartReorderRepo.findById(id);
    if (!reorder) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    return reorder;
  }

  async getAll() {
    return await this.smartReorderRepo.findAll();
  }

  async getByMedicineId(medicineId: string) {
    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }
    return await this.smartReorderRepo.findByMedicineId(medicineId);
  }

  async getPending() {
    return await this.smartReorderRepo.findByStatus("PENDING");
  }

  async approve(id: string) {
    const reorder = await this.smartReorderRepo.findById(id);
    if (!reorder) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    if (reorder.status !== "PENDING") {
      throw this.appError.badRequest(
        `Cannot approve a recommendation with status ${reorder.status}`,
      );
    }
    return await this.smartReorderRepo.update(id, {
      status: "APPROVED",
    } as any);
  }

  async generateForAllMedicines(threshold = 10, targetStock = 50) {
    const allMedicines = await this.medicineRepo.findAll();
    const results: {
      medicineId: string;
      status: "created" | "skipped" | "error";
      reason?: string;
    }[] = [];

    for (const medicine of allMedicines) {
      try {
        await this.generateRecommendationForMedicine(
          medicine._id.toString(),
          threshold,
          targetStock,
        );
        results.push({
          medicineId: medicine._id.toString(),
          status: "created",
        });
      } catch (err: any) {
        // Most common case: medicine isn't low on stock — not a real error,
        // just nothing to recommend. Still logged so the run is auditable.
        results.push({
          medicineId: medicine._id.toString(),
          status: "skipped",
          reason: err.message ?? "Unknown error",
        });
      }
    }

    return results;
  }
  async reject(id: string) {
    const reorder = await this.smartReorderRepo.findById(id);
    if (!reorder) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    if (reorder.status !== "PENDING") {
      throw this.appError.badRequest(
        `Cannot reject a recommendation with status ${reorder.status}`,
      );
    }
    return await this.smartReorderRepo.update(id, {
      status: "REJECTED",
    } as any);
  }

  async delete(id: string) {
    const deleted = await this.smartReorderRepo.delete(id);
    if (!deleted) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    return deleted;
  }
}
