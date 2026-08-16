import mongoose from "mongoose";
import type { MedicineBatchRepo } from "../../batch/repo/medicineBatch.repo.ts";
import type { InventoryRepo } from "../../inventory/repo/inventory.repo.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { SalesRepo } from "../../sales/repo/sales.repo.ts";
import type { SaleItemRepo } from "../../sales/repo/saleItem.repo.ts";
import type { SupplierRepo } from "../../supplier/repo/supplier.repo.ts";
import type { BatchService } from "../../batch/service/batch.service.ts";

import type { NotificationRecipientRepo } from "../../notification/repo/notificationRecipient.repo.ts";
import type { SmartReorderService } from "../../smartReorder/services/smartReorder.service.ts";
import type { InventoryMovementService } from "../../inventory/services/inventoryMovement.service.ts";
import type { BackgroundJobService } from "../../backgroundJobs/service/background.service.ts";
import { getCache, setCache } from "../../../shared/provider/redis.provider.ts";

const SUMMARY_CACHE_TTL_SECONDS = 60; // 2 min — dashboard data should feel fresh, unlike the 12h reorder cache

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
  ) {}

  async getSummary() {
    const [
      totalSales,
      totalPurchases,
      totalInventoryValue,
      totalMedicineBatches,
      activeSuppliers,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
      revenueTrend,
    ] = await Promise.all([
      this.salesRepo.getTotalSales(),
      this.purchaseRepo.getTotalPurchases(),
      this.inventoryRepo.getTotalInventoryValue(),
      this.medicineBatchRepo.getTotalMedicineBatches(),
      this.supplierRepo.getTotalSuppliers("active"),
      this.inventoryRepo.getLowStockCount(),
      this.inventoryRepo.getOutOfStockCount(),
      this.medicineBatchRepo.getExpiringSoonCount(30),
      this.getRevenueTrend(new Date().getFullYear()),
    ]);

    return {
      totalSales,
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
    const highConfidence = pending.filter((r: any) => r.confidenceScore >= 80);
    const totalSuggestedUnits = pending.reduce(
      (sum: number, r: any) => sum + r.suggestedQuantity,
      0,
    );

    return {
      pendingCount: pending.length,
      highConfidenceCount: highConfidence.length,
      totalSuggestedUnits,
      // NOTE: total suggested spend (units * price) intentionally omitted —
      // no reliable per-unit cost is attached to a recommendation today.
      // Would need to join against the medicine's latest purchase price.
      // Flag if you want that added.
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
      (sum: number, b: any) => sum + b.quantityRemaining,
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
      staleJobs: staleJobs.map((j: any) => ({
        jobName: j.jobName,
        startedAt: j.startedAt,
        status: j.status,
      })),
    };
  }

  async getRevenueTrend(year: number = new Date().getFullYear()) {
    return await this.salesRepo.getSalesByMonth(12, year);
  }

  async getNotificationSummary() {
    const [failed, pending] = await Promise.all([
      this.notificationRecipientRepo.countByStatus("Failed"),
      this.notificationRecipientRepo.countByStatus("Pending"),
    ]);
    return { failedDeliveries: failed, pendingDeliveries: pending };
  }

  async getProfitSummary() {
    const [totalSales, totalPurchases] = await Promise.all([
      this.salesRepo.getTotalSales(),
      this.purchaseRepo.getTotalPurchases(),
    ]);
    const grossProfit = totalSales - totalPurchases;
    const marginPercent =
      totalSales > 0 ? Math.round((grossProfit / totalSales) * 1000) / 10 : 0;
    return { totalSales, totalPurchases, grossProfit, marginPercent };
  }

  // This month vs last month, with % change — standard dashboard trend indicator.
  async getSalesComparison() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const [thisMonth, lastMonth] = await Promise.all([
      this.salesRepo.getTotalSalesInRange(startOfThisMonth, now),
      this.salesRepo.getTotalSalesInRange(startOfLastMonth, endOfLastMonth),
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

  async getSalesAnalytics(year: number, session?: mongoose.ClientSession) {
    const totalSales = await this.salesRepo.getTotalSales(session);
    const salesByMonth = await this.salesRepo.getSalesByMonth(
      12,
      year,
      session,
    );
    return { totalSales, salesByMonth };
  }

  async getPurchaseAnalytics(session?: mongoose.ClientSession) {
    const totalPurchases = await this.purchaseRepo.getTotalPurchases(session);
    const purchasesByStatus =
      await this.purchaseRepo.getPurchasesByStatus(session);
    return { totalPurchases, purchasesByStatus };
  }

  async getInventoryAnalytics(session?: mongoose.ClientSession) {
    const [
      totalValue,
      inventoryHealth,
      lowStockCount,
      outOfStockCount,
      expiringSoonCount,
    ] = await Promise.all([
      this.inventoryRepo.getTotalInventoryValue(session),
      this.inventoryRepo.getInventoryHealth(session),
      this.inventoryRepo.getLowStockCount(session),
      this.inventoryRepo.getOutOfStockCount(session),
      this.medicineBatchRepo.getExpiringSoonCount(30, session),
    ]);
    return {
      totalValue,
      inventoryHealth,
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
    const cacheKey = "dashboard:full-summary";
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
