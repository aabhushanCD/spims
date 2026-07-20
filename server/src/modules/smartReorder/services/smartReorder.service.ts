import type { AppError } from "../../../shared/error.ts";
import type { SmartReorderRepo } from "../repo/smartReorder.repo.ts";
import type { BatchService } from "../../batch/service/batch.service.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";
import type { SaleItemRepo } from "../../sales/repo/saleItem.repo.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import { getCache, setCache } from "../../../shared/provider/redis.provider.ts";
import {
  calculateWADS,
  calculateStdDev,
  calculateSupplierDelayFactor,
  calculateAdjustedLeadTime,
  calculateSafetyStock,
  calculateReorderPoint,
  calculateROQ,
  calculateConfidenceScore,
} from "../utils/smartReorder.Calculatro.ts";

export interface CreateSmartReorderDto {
  medicineId: string;
  suggestedQuantity: number;
  confidenceScore: number;
  recommendationReason: string;
}

const REVIEW_PERIOD_DAYS = 7;
const EXPIRY_LOOKAHEAD_DAYS = 30;
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 hours, per spec 11.9

export class SmartReorderService {
  constructor(
    private readonly smartReorderRepo: SmartReorderRepo,
    private readonly batchService: BatchService,
    private readonly medicineRepo: MedicineRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly batchRepo: MedicineBatchRepo,
    private readonly purchaseOrderRepo: PurchaseOrderRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly appError: typeof AppError,
  ) {}

  // Manual/admin-authored recommendation — bypasses the algorithm entirely.
  // Kept for cases like an admin overriding with their own judgment call.
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

  // Real algorithm — WADS, safety stock, reorder point, ROQ, confidence
  // score, all per the SPIMS spec. Cached in Redis for 12h so repeated
  // reads (e.g. dashboard polling) don't recompute every time.
  async generateRecommendationForMedicine(medicineId: string) {
    const cacheKey = `reorder:${medicineId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      throw this.appError.notFound("Medicine not found");
    }

    // 1. Demand history
    const dailySales = await this.saleItemRepo.getDailySalesForMedicine(
      medicineId,
      30,
    );
    const daysWithSalesData = dailySales.filter((d) => d > 0).length;
    const wads = calculateWADS(dailySales);
    const sigma = calculateStdDev(dailySales, wads);

    // 2. Supplier + lead time (derived from most recent purchase order)
    const purchaseOrderId =
      await this.batchRepo.findMostRecentPurchaseOrderId(medicineId);
    if (!purchaseOrderId) {
      throw this.appError.badRequest(
        "No purchase history found for this medicine — cannot determine supplier lead time",
      );
    }
    const latestOrder = await this.purchaseOrderRepo.findById(
      purchaseOrderId.toString(),
    );
    const supplier = await this.supplierRepo.findById(
      latestOrder!.supplierId.toString(),
    );
    if (!supplier) {
      throw this.appError.notFound("Supplier not found");
    }

    const recentOrders = await this.purchaseOrderRepo.findRecentBySupplier(
      supplier._id.toString(),
      10,
    );
    const avgDelayDays =
      recentOrders.length > 0
        ? recentOrders.reduce((sum, o) => {
            const delayMs =
              o.receivedDate!.getTime() - o.expectedDeliveryDate!.getTime();
            return sum + delayMs / (1000 * 60 * 60 * 24);
          }, 0) / recentOrders.length
        : 0;

    const baseLeadTime = supplier.leadTime;
    const sdf = calculateSupplierDelayFactor(avgDelayDays, baseLeadTime);
    const alt = calculateAdjustedLeadTime(baseLeadTime, sdf);

    // 3. Safety stock + reorder point
    const safetyStock = calculateSafetyStock(sigma, alt);
    const rop = calculateReorderPoint(wads, alt, safetyStock);

    // 4. Current usable stock + expiry risk
    const expiryCutoff = new Date();
    expiryCutoff.setDate(expiryCutoff.getDate() + alt + EXPIRY_LOOKAHEAD_DAYS);
    const currentStock = await this.batchRepo.getUsableStock(
      medicineId,
      expiryCutoff,
    );
    const expiryRiskUnits = await this.batchRepo.getExpiringUnits(
      medicineId,
      expiryCutoff,
    );

    // 5. Reorder decision — no reorder needed, cache the negative result too
    if (currentStock > rop) {
      const result = {
        medicineId,
        reorderNeeded: false,
        currentStock,
        reorderPoint: Math.round(rop),
      };
      await setCache(cacheKey, result, CACHE_TTL_SECONDS);
      throw this.appError.badRequest(
        `Medicine is not currently below reorder point (stock: ${currentStock}, ROP: ${Math.round(rop)})`,
      );
    }

    // 6. Recommended order quantity
    const roq = calculateROQ({
      wads,
      adjustedLeadTime: alt,
      reviewPeriod: REVIEW_PERIOD_DAYS,
      safetyStock,
      currentStock,
      expiryRiskUnits,
    });

    // 7. Confidence score
    const supplierReliabilityScore = this.computeReliabilityScore(
      avgDelayDays,
      baseLeadTime,
    );
    const confidence = calculateConfidenceScore({
      daysWithSalesData,
      wads,
      sigma,
      supplierReliabilityScore,
    });

    const recommendation = await this.smartReorderRepo.create({
      medicineId,
      suggestedQuantity: roq,
      confidenceScore: confidence,
      recommendationReason: `Stock (${currentStock}) at/below reorder point (${Math.round(rop)}).${
        expiryRiskUnits > 0
          ? ` ${expiryRiskUnits} units expiring soon excluded from usable stock.`
          : ""
      }`,
      generatedAt: new Date(),
      status: "PENDING",
      WADS: wads,
      demandStdDev: sigma,
      adjustedLeadTime: alt,
      safetyStock,
      reorderPoint: rop,
      currentStock,
      expiryRiskUnits,
      supplierId: supplier._id,
    } as any);

    await setCache(cacheKey, recommendation, CACHE_TTL_SECONDS);
    return recommendation;
  }

  // Heuristic interpretation of "supplier reliability" — see prior message,
  // flagged as a judgment call since 11.7 doesn't define this formula.
  private computeReliabilityScore(
    avgDelayDays: number,
    baseLeadTime: number,
  ): number {
    if (baseLeadTime <= 0) return 100;
    const delayRatio = Math.max(0, avgDelayDays) / baseLeadTime;
    return Math.max(0, Math.round(100 - delayRatio * 100));
  }

  async generateForAllMedicines() {
    const allMedicines = await this.medicineRepo.findAll();
    const results: {
      medicineId: string;
      status: "created" | "skipped" | "error";
      reason?: string;
    }[] = [];

    for (const medicine of allMedicines) {
      try {
        await this.generateRecommendationForMedicine(medicine._id.toString());
        results.push({
          medicineId: medicine._id.toString(),
          status: "created",
        });
      } catch (err: any) {
        // Most common case: medicine isn't below reorder point, or has no
        // purchase history yet — not a real error, just nothing to do.
        results.push({
          medicineId: medicine._id.toString(),
          status: "skipped",
          reason: err.message ?? "Unknown error",
        });
      }
    }

    return results;
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
