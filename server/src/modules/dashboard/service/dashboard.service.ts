import mongoose from "mongoose";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { InventoryRepo } from "../../inventory/repo/inventory.repo.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { ReturnRepo } from "../../sales/repo/return.repo.ts";
import type { SalesRepo } from "../../sales/repo/sales.repo.ts";
import type { SaleItemRepo } from "../../sales/repo/saleItem.repo.ts";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import type { BatchService } from "../../batch/service/batch.service.ts";

import type { NotificationRecipientRepo } from "../../notification/repo/notificationRecipient.repo.ts";
import type { SmartReorderService } from "../../smartReorder/services/smartReorder.service.ts";
import type { InventoryMovementService } from "../../inventory/services/inventoryMovement.service.ts";
import type { BackgroundJobService } from "../../backgroundJobs/service/background.service.ts";
import { getCache, setCache } from "../../../shared/provider/redis.provider.ts";
import { DASHBOARD_CACHE_KEY } from "../../../shared/provider/cacheKeys.ts";
import { getReportingTimeZone } from "../../../config/reporting.config.ts";
import { roundCurrency } from "../../../shared/finance/money.ts";
import {
  getCurrentMonthRange,
  getPreviousMonthRange,
  getYearRange,
  getZonedParts,
} from "../../../shared/utils/reportingPeriod.ts";

const SUMMARY_CACHE_TTL_SECONDS = 60;

export class DashboardService {
  constructor(
    private readonly salesRepo: SalesRepo,
    private readonly saleItemRepo: SaleItemRepo,
    private readonly purchaseRepo: PurchaseOrderRepo,
    private readonly inventoryRepo: InventoryRepo,
    private readonly medicineBatchRepo: MedicineBatchRepo,
    private readonly supplierRepo: SupplierRepo,
    private readonly smartReorderService: SmartReorderService,
    private readonly batchService: BatchService,
    private readonly inventoryMovementService: InventoryMovementService,
    private readonly backgroundJobService: BackgroundJobService,
    private readonly notificationRecipientRepo: NotificationRecipientRepo,
    private readonly returnRepo: ReturnRepo,
  ) {}

  async getSummary(now: Date = new Date(), timeZone = getReportingTimeZone()) {
    const range = getCurrentMonthRange(now, timeZone);
    const year = getZonedParts(now, timeZone).year;

    const [
      salesTotals,
      totalPurchases,
      totalInventoryValue,
      totalMedicineBatches,
      activeSuppliers,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      revenueTrend,
    ] = await Promise.all([
      this.salesRepo.getSalesTotalsInRange(range.start, range.endExclusive),
      this.purchaseRepo.getTotalPurchasesInRange(
        range.start,
        range.endExclusive,
      ),
      this.inventoryRepo.getTotalInventoryValue(),
      this.medicineBatchRepo.getTotalMedicineBatches(),
      this.supplierRepo.getTotalSuppliers("active"),
      this.inventoryRepo.getLowStockCount(),
      this.inventoryRepo.getOutOfStockCount(),
      this.medicineBatchRepo.getExpiringSoonCount(30),
      this.getRevenueTrend(year, now, timeZone),
    ]);

    return {
      totalSales: salesTotals.gross,
      totalPurchases,
      totalInventoryValue,
      totalMedicineBatches,
      activeSuppliers,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      revenueTrend,
    };
  }

  // Headline metric for the "smart" part of the system — pending
  // recommendations, how many are high-confidence, total units recommended.
  async getReorderSummary() {
    const pending = await this.smartReorderService.getPending();
    const highConfidence = pending.filter(
      (r) => (r.confidenceScore ?? 0) >= 80,
    );
    const totalSuggestedUnits = pending.reduce(
      (sum, r) => sum + r.suggestedQuantity,
      0,
    );

    return {
      pendingCount: pending.length,
      highConfidenceCount: highConfidence.length,
      totalSuggestedUnits,
      // NOTE: total suggested spend (units * price) intentionally omitted —
      // no reliable per-unit cost is attached to a recommendation today.
    };
  }

  // Actionable expiry queue: what's already expired and needs a pharmacist
  // to confirm disposal, separate from "expiring soon" which is a warning.
  async getExpirySummary() {
    const [awaitingDisposal, expiringSoonCount] = await Promise.all([
      this.batchService.getExpiredAwaitingDisposal(),
      this.medicineBatchRepo.getExpiringSoonCount(30),
    ]);

    const unitsAwaitingDisposal = awaitingDisposal.reduce(
      (sum, b) => sum + b.quantityRemaining,
      0,
    );

    return {
      batchesAwaitingDisposal: awaitingDisposal.length,
      unitsAwaitingDisposal,
      expiringSoonCount,
    };
  }

  async getRecentActivity(limit: number = 10) {
    return await this.inventoryMovementService.getRecentMovements(limit);
  }

  // Surfaces silently-failed cron runs — e.g. last night's expiry-check or
  // reorder-calculation job crashing without anyone noticing.
  async getSystemHealth() {
    const staleJobs = await this.backgroundJobService.getStaleJobs(60);
    return {
      staleJobCount: staleJobs.length,
      staleJobs: staleJobs.map((j) => ({
        jobName: j.jobName,
        startedAt: j.startedAt,
        status: j.status,
      })),
    };
  }

  async getRevenueTrend(
    year?: number,
    now: Date = new Date(),
    timeZone = getReportingTimeZone(),
  ) {
    const targetYear = year ?? getZonedParts(now, timeZone).year;
    return await this.salesRepo.getSalesByMonth({
      year: targetYear,
      months: 12,
      timeZone,
      now,
    });
  }

  async getNotificationSummary() {
    const [failed, pending, skipped] = await Promise.all([
      this.notificationRecipientRepo.countByStatus("Failed"),
      this.notificationRecipientRepo.countByStatus("Pending"),
      this.notificationRecipientRepo.countByStatus("Skipped"),
    ]);
    return {
      failedDeliveries: failed,
      pendingDeliveries: pending,
      skippedDeliveries: skipped,
    };
  }

  /**
   * COGS-based gross profit for the current month.
   *
   * netRevenue = (gross sales − sales VAT) − (refunds − refund VAT)
   * grossProfit = netRevenue − COGS
   */
  async getProfitSummary(
    now: Date = new Date(),
    timeZone = getReportingTimeZone(),
  ) {
    const range = getCurrentMonthRange(now, timeZone);

    const [sales, totalPurchases, refunds, cogs] = await Promise.all([
      this.salesRepo.getSalesTotalsInRange(range.start, range.endExclusive),
      this.purchaseRepo.getTotalPurchasesInRange(
        range.start,
        range.endExclusive,
      ),
      this.returnRepo.getRefundTotalsInRange(
        range.start,
        range.endExclusive,
      ),
      this.saleItemRepo.getCogsInRange(range.start, range.endExclusive),
    ]);

    const netRefunds = roundCurrency(refunds.grossRefunds - refunds.refundVat);
    const netRevenue = roundCurrency(sales.gross - sales.vat - netRefunds);
    const grossProfit = roundCurrency(netRevenue - cogs);
    const marginPercent =
      netRevenue > 0
        ? Math.round((grossProfit / netRevenue) * 1000) / 10
        : 0;

    return {
      totalSales: sales.gross,
      totalPurchases,
      netRevenue,
      cogs,
      grossProfit,
      marginPercent,
    };
  }

  // This month vs last month, with % change — standard dashboard trend indicator.
  async getSalesComparison(
    now: Date = new Date(),
    timeZone = getReportingTimeZone(),
  ) {
    const thisRange = getCurrentMonthRange(now, timeZone);
    const lastRange = getPreviousMonthRange(now, timeZone);

    const [thisMonth, lastMonth] = await Promise.all([
      this.salesRepo.getTotalSalesInRange(
        thisRange.start,
        thisRange.endExclusive,
      ),
      this.salesRepo.getTotalSalesInRange(
        lastRange.start,
        lastRange.endExclusive,
      ),
    ]);

    const percentChange =
      lastMonth > 0
        ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10
        : null; // null = no baseline to compare against

    return { thisMonth, lastMonth, percentChange };
  }

  async getSupplierAnalytics() {
    const [activeSuppliers, inactiveSuppliers] = await Promise.all([
      this.supplierRepo.getTotalSuppliers("active"),
      this.supplierRepo.getTotalSuppliers("inActive"),
    ]);
    return {
      activeSuppliers,
      inactiveSuppliers,
      total: activeSuppliers + inactiveSuppliers,
    };
  }

  async getSalesAnalytics(
    year: number,
    session?: mongoose.ClientSession,
  ) {
    const now = new Date();
    const timeZone = getReportingTimeZone();
    const range = getYearRange(year, timeZone);

    const [totals, salesByMonth] = await Promise.all([
      this.salesRepo.getSalesTotalsInRange(
        range.start,
        range.endExclusive,
        session,
      ),
      this.salesRepo.getSalesByMonth({
        year,
        months: 12,
        timeZone,
        now,
        ...(session ? { session } : {}),
      }),
    ]);

    return {
      year,
      totalSales: totals.gross,
      totalVat: totals.vat,
      salesByMonth,
    };
  }

  async getPurchaseAnalytics(session?: mongoose.ClientSession) {
    const now = new Date();
    const timeZone = getReportingTimeZone();
    const range = getCurrentMonthRange(now, timeZone);

    const [totalPurchases, purchasesByStatus] = await Promise.all([
      this.purchaseRepo.getTotalPurchasesInRange(
        range.start,
        range.endExclusive,
        session,
      ),
      this.purchaseRepo.getPurchasesByStatus(session),
    ]);
    return { totalPurchases, purchasesByStatus };
  }

  async getInventoryAnalytics(session?: mongoose.ClientSession) {
    const [totalValue, lowStockCount, outOfStockCount, expiringSoonCount] =
      await Promise.all([
        this.inventoryRepo.getTotalInventoryValue(session),
        this.inventoryRepo.getLowStockCount(session),
        this.inventoryRepo.getOutOfStockCount(session),
        this.medicineBatchRepo.getExpiringSoonCount(30, session),
      ]);

    return {
      totalValue,
      inventoryHealth: {
        totalValue,
        lowStockCount,
        outOfStockCount,
        expiringSoonCount,
      },
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
    };
  }

  async getTopSellingMedicines(
    limit: number = 10,
    session?: mongoose.ClientSession,
  ) {
    return await this.saleItemRepo.getTopSellingMedicines(limit, session);
  }

  // Single entry point for a dashboard landing page — bundles everything
  // above into one cached call instead of 9 separate round-trips + 9 cache
  // checks from the frontend.
  async getFullDashboard() {
    const cacheKey = DASHBOARD_CACHE_KEY;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const [
      summary,
      reorder,
      expiry,
      recentActivity,
      systemHealth,
      notifications,
      profit,
      salesComparison,
    ] = await Promise.all([
      this.getSummary(),
      this.getReorderSummary(),
      this.getExpirySummary(),
      this.getRecentActivity(10),
      this.getSystemHealth(),
      this.getNotificationSummary(),
      this.getProfitSummary(),
      this.getSalesComparison(),
    ]);

    const result = {
      summary,
      reorder,
      expiry,
      recentActivity,
      systemHealth,
      notifications,
      profit,
      salesComparison,
    };
    await setCache(cacheKey, result, SUMMARY_CACHE_TTL_SECONDS);
    return result;
  }
}
