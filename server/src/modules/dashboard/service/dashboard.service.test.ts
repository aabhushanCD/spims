import { describe, expect, it, vi } from "vitest";

import type { NotificationRecipientRepo } from "../../notification/repo/notificationRecipient.repo.ts";
import { DashboardService } from "./dashboard.service.ts";

function buildService() {
  const salesRepo = {
    getSalesTotalsInRange: vi.fn().mockResolvedValue({ gross: 0, vat: 0 }),
    getTotalSalesInRange: vi.fn().mockResolvedValue(0),
    getSalesByMonth: vi.fn().mockResolvedValue([]),
  };
  const saleItemRepo = {
    getCogsInRange: vi.fn().mockResolvedValue(0),
    getTopSellingMedicines: vi.fn().mockResolvedValue([]),
  };
  const purchaseRepo = {
    getTotalPurchasesInRange: vi.fn().mockResolvedValue(0),
    getPurchasesByStatus: vi.fn().mockResolvedValue([]),
  };
  const inventoryRepo = {
    getTotalInventoryValue: vi.fn().mockResolvedValue(0),
    getLowStockCount: vi.fn().mockResolvedValue(0),
    getOutOfStockCount: vi.fn().mockResolvedValue(0),
  };
  const medicineBatchRepo = {
    getExpiringSoonCount: vi.fn().mockResolvedValue(0),
    getTotalMedicineBatches: vi.fn().mockResolvedValue(0),
  };
  const supplierRepo = {
    getTotalSuppliers: vi.fn().mockResolvedValue(0),
  };
  const smartReorderService = {
    getPending: vi.fn().mockResolvedValue([]),
  };
  const batchService = {
    getExpiredAwaitingDisposal: vi.fn().mockResolvedValue([]),
  };
  const inventoryMovementService = {
    getRecentMovements: vi.fn().mockResolvedValue([]),
  };
  const backgroundJobService = {
    getStaleJobs: vi.fn().mockResolvedValue([]),
  };
  const notificationRecipientRepo = {
    countByStatus: vi.fn().mockResolvedValue(0),
  };
  const returnRepo = {
    getRefundTotalsInRange: vi
      .fn()
      .mockResolvedValue({ grossRefunds: 0, refundVat: 0 }),
  };

  const service = new DashboardService(
    salesRepo as never,
    saleItemRepo as never,
    purchaseRepo as never,
    inventoryRepo as never,
    medicineBatchRepo as never,
    supplierRepo as never,
    smartReorderService as never,
    batchService as never,
    inventoryMovementService as never,
    backgroundJobService as never,
    notificationRecipientRepo as unknown as NotificationRecipientRepo,
    returnRepo as never,
  );

  return {
    service,
    salesRepo,
    saleItemRepo,
    purchaseRepo,
    inventoryRepo,
    medicineBatchRepo,
    notificationRecipientRepo,
    returnRepo,
  };
}

describe("DashboardService notification summary", () => {
  it("counts Skipped separately from Failed", async () => {
    const { service, notificationRecipientRepo } = buildService();
    notificationRecipientRepo.countByStatus.mockImplementation(
      async (status: string) => {
        if (status === "Failed") return 2;
        if (status === "Pending") return 3;
        if (status === "Skipped") return 4;
        return 0;
      },
    );

    await expect(service.getNotificationSummary()).resolves.toEqual({
      failedDeliveries: 2,
      pendingDeliveries: 3,
      skippedDeliveries: 4,
    });
    expect(notificationRecipientRepo.countByStatus).toHaveBeenCalledWith(
      "Skipped",
    );
  });
});

describe("DashboardService financial reporting", () => {
  const now = new Date("2026-02-15T00:00:00Z");

  it("computes COGS-based profit from an independent fixture", async () => {
    const {
      service,
      salesRepo,
      saleItemRepo,
      purchaseRepo,
      returnRepo,
    } = buildService();
    salesRepo.getSalesTotalsInRange.mockResolvedValue({
      gross: 1130,
      vat: 130,
    });
    purchaseRepo.getTotalPurchasesInRange.mockResolvedValue(500);
    returnRepo.getRefundTotalsInRange.mockResolvedValue({
      grossRefunds: 226,
      refundVat: 26,
    });
    saleItemRepo.getCogsInRange.mockResolvedValue(500);

    await expect(
      service.getProfitSummary(now, "UTC"),
    ).resolves.toEqual({
      totalSales: 1130,
      totalPurchases: 500,
      // 1000 net sales - 200 net refunds = 800
      netRevenue: 800,
      cogs: 500,
      grossProfit: 300,
      marginPercent: 37.5,
    });

    expect(salesRepo.getSalesTotalsInRange).toHaveBeenCalledWith(
      new Date("2026-02-01T00:00:00Z"),
      new Date("2026-03-01T00:00:00Z"),
    );
  });

  it("compares this month with last month", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.getTotalSalesInRange
      .mockResolvedValueOnce(120)
      .mockResolvedValueOnce(100);

    await expect(
      service.getSalesComparison(now, "UTC"),
    ).resolves.toEqual({
      thisMonth: 120,
      lastMonth: 100,
      percentChange: 20,
    });
  });

  it("honours the requested year for sales analytics", async () => {
    const { service, salesRepo } = buildService();
    salesRepo.getSalesTotalsInRange.mockResolvedValue({
      gross: 500,
      vat: 65,
    });
    salesRepo.getSalesByMonth.mockResolvedValue([
      { month: 1, total: 500, count: 2 },
    ]);

    await expect(service.getSalesAnalytics(2025)).resolves.toEqual({
      year: 2025,
      totalSales: 500,
      totalVat: 65,
      salesByMonth: [{ month: 1, total: 500, count: 2 }],
    });

    expect(salesRepo.getSalesByMonth).toHaveBeenCalledWith(
      expect.objectContaining({ year: 2025, months: 12 }),
    );
  });

  it("uses the batch repository for the expiring-soon count", async () => {
    const {
      service,
      inventoryRepo,
      medicineBatchRepo,
    } = buildService();
    inventoryRepo.getTotalInventoryValue.mockResolvedValue(1000);
    inventoryRepo.getLowStockCount.mockResolvedValue(1);
    inventoryRepo.getOutOfStockCount.mockResolvedValue(2);
    medicineBatchRepo.getExpiringSoonCount.mockResolvedValue(3);

    const result = await service.getInventoryAnalytics();

    expect(result).toMatchObject({
      totalValue: 1000,
      lowStockCount: 1,
      outOfStockCount: 2,
      expiringSoonCount: 3,
      inventoryHealth: {
        totalValue: 1000,
        lowStockCount: 1,
        outOfStockCount: 2,
        expiringSoonCount: 3,
      },
    });
    expect(medicineBatchRepo.getExpiringSoonCount).toHaveBeenCalledWith(
      30,
      undefined,
    );
  });
});
