import type { AppError } from "../../../shared/error.ts";
import { Types } from "mongoose";
import type { SmartReorderRepo } from "../repo/smartReorder.repo.ts";
import type { BatchService } from "../../batch/service/batch.service.ts";
import type { MedicineRepo } from "../../medicine/repo/medicine.repo.ts";
import type { SaleItemRepo } from "../../sales/repo/saleItem.repo.ts";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import { getCache, setCache } from "../../../shared/provider/redis.provider.ts";
import { reorderCacheKey } from "../../../shared/provider/cacheKeys.ts";
import {
  noopCacheInvalidator,
  type CacheInvalidator,
} from "../../../shared/provider/cacheInvalidator.ts";
import type { ISmartReorder } from "../model/smartReorder.model.ts";
import type { PurchaseOrderService } from "../../purchase/services/purchaseOrder.service.ts";
import { logger } from "../../../shared/logger.ts";
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
  supplierId: string;
  suggestedQuantity: number;
  confidenceScore: number;
  recommendationReason: string;
}

const REVIEW_PERIOD_DAYS = 7;
const EXPIRY_LOOKAHEAD_DAYS = 30;
const CACHE_TTL_SECONDS = 12 * 60 * 60; // 12 hours, per spec 11.9
const DAY_MS = 1000 * 60 * 60 * 24;

type GenerationOutcome =
  | { status: "created"; recommendation: ISmartReorder }
  | { status: "skipped"; reason: string };

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
    private readonly cacheInvalidator: CacheInvalidator = noopCacheInvalidator,
    private readonly purchaseOrderService?: PurchaseOrderService,
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
    if (dto.confidenceScore < 0 || dto.confidenceScore > 100) {
      throw this.appError.badRequest(
        "confidenceScore must be between 0 and 100",
      );
    }

    const supplier = await this.supplierRepo.findById(dto.supplierId);
    if (!supplier) {
      throw this.appError.notFound("Supplier not found");
    }

    const created = await this.smartReorderRepo.create({
      medicineId: new Types.ObjectId(dto.medicineId),
      supplierId: new Types.ObjectId(dto.supplierId),
      suggestedQuantity: dto.suggestedQuantity,
      confidenceScore: dto.confidenceScore,
      recommendationReason: dto.recommendationReason,
      generatedAt: new Date(),
      status: "PENDING",
      WADS: 0,
      demandStdDev: 0,
      adjustedLeadTime: 0,
      safetyStock: 0,
      reorderPoint: 0,
      currentStock: 0,
      expiryRiskUnits: 0,
    });
    await this.invalidateDashboard();
    return created;
  }

  // Real algorithm — WADS, safety stock, reorder point, ROQ, confidence
  // score, all per the SPIMS spec. Cached in Redis for 12h so repeated
  // reads (e.g. dashboard polling) don't recompute every time.
  async generateRecommendationForMedicine(medicineId: string) {
    const outcome = await this.generateRecommendationOutcome(medicineId);
    if (outcome.status === "skipped") {
      throw this.appError.badRequest(outcome.reason);
    }
    return outcome.recommendation;
  }

  private async generateRecommendationOutcome(
    medicineId: string,
  ): Promise<GenerationOutcome> {
    const cacheKey = reorderCacheKey(medicineId);
    const cached = await getCache(cacheKey);
    if (cached) {
      // A negative result must keep the same 400 semantics on every request,
      // not turn into a success just because it came from the cache.
      if (cached.reorderNeeded === false) {
        return {
          status: "skipped",
          reason:
            typeof cached.reason === "string"
              ? cached.reason
              : "Medicine is not currently below reorder point",
        };
      }
      return {
        status: "created",
        recommendation: cached as ISmartReorder,
      };
    }

    const medicine = await this.medicineRepo.findById(medicineId);
    if (!medicine) {
      return { status: "skipped", reason: "Medicine not found" };
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
      return {
        status: "skipped",
        reason:
          "No purchase history found for this medicine — cannot determine supplier lead time",
      };
    }
    const latestOrder = await this.purchaseOrderRepo.findById(
      purchaseOrderId.toString(),
    );
    if (!latestOrder) {
      return { status: "skipped", reason: "Purchase order not found" };
    }
    const supplier = await this.supplierRepo.findById(
      latestOrder.supplierId.toString(),
    );
    if (!supplier) {
      return { status: "skipped", reason: "Supplier not found" };
    }

    const recentOrders = await this.purchaseOrderRepo.findRecentBySupplier(
      supplier._id.toString(),
      10,
    );
    const delays = recentOrders
      .map((order) => {
        const receivedAt = order.receivedDate;
        const expectedAt = order.expectedDeliveryDate;
        if (!(receivedAt instanceof Date) || !(expectedAt instanceof Date)) {
          return null;
        }
        const delayMs = receivedAt.getTime() - expectedAt.getTime();
        return Number.isFinite(delayMs) ? delayMs / DAY_MS : null;
      })
      .filter((delay): delay is number => delay !== null);
    const avgDelayDays =
      delays.length > 0
        ? delays.reduce((sum, delay) => sum + delay, 0) / delays.length
        : 0;

    const baseLeadTime = supplier.leadTime;
    const sdf = calculateSupplierDelayFactor(avgDelayDays, baseLeadTime);
    const alt = calculateAdjustedLeadTime(baseLeadTime, sdf);

    // 3. Safety stock + reorder point
    const safetyStock = calculateSafetyStock(sigma, alt);
    const rop = calculateReorderPoint(wads, alt, safetyStock);

    // 4. Current usable stock + expiry risk. Expired stock is not "expiring
    // soon" and must not inflate the order quantity.
    const now = new Date();
    const expiryCutoff = new Date(now);
    expiryCutoff.setDate(expiryCutoff.getDate() + alt + EXPIRY_LOOKAHEAD_DAYS);
    const currentStock = await this.batchRepo.getUsableStock(
      medicineId,
      expiryCutoff,
    );
    const expiryRiskUnits = await this.batchRepo.getExpiringUnits(
      medicineId,
      now,
      expiryCutoff,
    );

    // 5. Reorder decision — no reorder needed, cache the negative result too
    if (currentStock > rop) {
      const reason = `Medicine is not currently below reorder point (stock: ${currentStock}, ROP: ${Math.round(rop)})`;
      const result = {
        medicineId,
        reorderNeeded: false,
        currentStock,
        reorderPoint: Math.round(rop),
        reason,
      };
      await setCache(cacheKey, result, CACHE_TTL_SECONDS);
      return { status: "skipped", reason };
    }

    // 6. Recommended order quantity
    const baseRoq = calculateROQ({
      wads,
      adjustedLeadTime: alt,
      reviewPeriod: REVIEW_PERIOD_DAYS,
      safetyStock,
      currentStock,
      expiryRiskUnits,
      ...(medicine.moq && medicine.moq > 0 ? { moq: medicine.moq } : {}),
    });
    const roq =
      medicine.packSize && medicine.packSize > 1
        ? Math.ceil(baseRoq / medicine.packSize) * medicine.packSize
        : baseRoq;

    // 7. Confidence score. With no valid delivery delays, fall back to the
    // supplier's persisted score (or full confidence) instead of treating the
    // schema default of 0 as real history.
    const hasDelayHistory = delays.length > 0;
    const supplierReliabilityScore = hasDelayHistory
      ? this.computeReliabilityScore(avgDelayDays, baseLeadTime)
      : supplier.reliabilityScore && supplier.reliabilityScore > 0
        ? supplier.reliabilityScore
        : 100;

    if (hasDelayHistory) {
      try {
        await this.supplierRepo.updateReliabilityScore(
          supplier._id.toString(),
          supplierReliabilityScore,
        );
      } catch (error) {
        logger.warn("supplier_reliability_persist_failed", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const confidence = calculateConfidenceScore({
      daysWithSalesData,
      wads,
      sigma,
      supplierReliabilityScore,
    });

    const recommendation = await this.smartReorderRepo.upsertPending({
      medicineId: new Types.ObjectId(medicineId),
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
    });

    await setCache(cacheKey, recommendation, CACHE_TTL_SECONDS);
    await this.invalidateDashboard();
    return { status: "created", recommendation };
  }

  private async invalidateDashboard(): Promise<void> {
    try {
      await this.cacheInvalidator.invalidateDashboard();
    } catch (error) {
      logger.warn("cache_invalidation_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
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
        const outcome = await this.generateRecommendationOutcome(
          medicine._id.toString(),
        );
        if (outcome.status === "created") {
          results.push({
            medicineId: medicine._id.toString(),
            status: "created",
          });
        } else {
          results.push({
            medicineId: medicine._id.toString(),
            status: "skipped",
            reason: outcome.reason,
          });
        }
      } catch (error) {
        // Most common case: medicine isn't below reorder point, or has no
        // purchase history yet — not a real error, just nothing to do.
        results.push({
          medicineId: medicine._id.toString(),
          status: "skipped",
          reason: error instanceof Error ? error.message : "Unknown error",
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

  async getAll(status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL") {
    if (!status) {
      return await this.smartReorderRepo.findAll("PENDING");
    }
    if (status === "ALL") {
      return await this.smartReorderRepo.findAll();
    }
    return await this.smartReorderRepo.findByStatus(status);
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

  async approve(
    id: string,
    performedBy?: string,
    createPurchaseOrder = false,
  ) {
    const reorder = await this.smartReorderRepo.findById(id);
    if (!reorder) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    if (reorder.status !== "PENDING") {
      throw this.appError.badRequest(
        `Cannot approve a recommendation with status ${reorder.status}`,
      );
    }

    let purchaseOrderId: Types.ObjectId | undefined;
    if (createPurchaseOrder) {
      if (
        !this.purchaseOrderService ||
        process.env.SMART_REORDER_AUTO_PO !== "true"
      ) {
        throw this.appError.badRequest(
          "Automatic purchase order creation is disabled or not configured",
        );
      }
      const supplier = await this.supplierRepo.findById(
        reorder.supplierId.toString(),
      );
      if (!supplier || supplier.status !== "active") {
        throw this.appError.badRequest(
          "Recommendation supplier is missing or inactive",
        );
      }
      const batches = await this.batchRepo.findAllByMedicineId(
        reorder.medicineId.toString(),
      );
      const purchasePrice = batches[0]?.purchasePrice;
      if (!purchasePrice || purchasePrice <= 0) {
        throw this.appError.badRequest(
          "Cannot auto-create a purchase order without a batch purchase price",
        );
      }
      const purchaseOrder = await this.purchaseOrderService.createPurchaseOrder({
        supplierId: reorder.supplierId.toString(),
        orderDate: new Date(),
        invoiceNumber: `AUTO-${reorder._id.toString()}`,
        invoiceFile: "",
        discount: 0,
        VAT: 13,
        items: [
          {
            medicineId: reorder.medicineId.toString(),
            quantity: reorder.suggestedQuantity,
            purchasePrice,
          },
        ],
      });
      purchaseOrderId = purchaseOrder._id;
    }

    const updated = await this.smartReorderRepo.update(id, {
      status: "APPROVED",
      ...(performedBy
        ? {
            approvedBy: new Types.ObjectId(performedBy),
            approvedAt: new Date(),
          }
        : {}),
      ...(purchaseOrderId ? { purchaseOrderId } : {}),
    });
    await this.invalidateDashboard();
    return updated;
  }

  async reject(id: string, performedBy?: string, reason?: string) {
    const reorder = await this.smartReorderRepo.findById(id);
    if (!reorder) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    if (reorder.status !== "PENDING") {
      throw this.appError.badRequest(
        `Cannot reject a recommendation with status ${reorder.status}`,
      );
    }
    const updated = await this.smartReorderRepo.update(id, {
      status: "REJECTED",
      ...(performedBy
        ? {
            rejectedBy: new Types.ObjectId(performedBy),
            rejectedAt: new Date(),
          }
        : {}),
      ...(reason ? { rejectionReason: reason } : {}),
    });
    await this.invalidateDashboard();
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.smartReorderRepo.delete(id);
    if (!deleted) {
      throw this.appError.notFound("Smart reorder recommendation not found");
    }
    await this.invalidateDashboard();
    return deleted;
  }
}
