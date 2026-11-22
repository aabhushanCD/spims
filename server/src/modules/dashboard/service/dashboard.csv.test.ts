import { describe, expect, it, vi } from "vitest";

import { DashboardService } from "./dashboard.service.ts";

function buildService() {
  const inventoryRepo = {
    findAll: vi.fn().mockResolvedValue([
      {
        medicineId: {
          _id: "507f1f77bcf86cd799439011",
          medicineName: "=Paracetamol",
        },
        currentStock: 5,
        reservedStock: 1,
        availableStock: 4,
      },
    ]),
  };
  const salesRepo = {
    findRowsInRange: vi.fn().mockResolvedValue([
      {
        invoiceNumber: "INV-1",
        customerName: "=cmd",
        saleDate: new Date("2026-01-01T00:00:00Z"),
        subTotal: 10,
        VAT: 1.3,
        discount: 0,
        totalAmount: 11.3,
        paymentMethod: "CASH",
        status: "COMPLETED",
      },
    ]),
  };
  const service = new DashboardService(
    salesRepo as never,
    {} as never,
    {} as never,
    inventoryRepo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, inventoryRepo, salesRepo };
}

describe("Dashboard CSV export", () => {
  it("returns an inventory snapshot without requiring a date range", async () => {
    const { service } = buildService();

    const csv = await service.getCsvExport("inventory");

    expect(csv).toContain("asOf");
    expect(csv).toContain("Paracetamol");
    expect(csv).toContain("currentStock");
  });

  it("neutralizes spreadsheet formulas", async () => {
    const { service } = buildService();

    const csv = await service.getCsvExport(
      "sales",
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-02-01T00:00:00Z"),
    );

    expect(csv).toContain("'=cmd");
  });

  it("rejects a time-based export without a range", async () => {
    const { service } = buildService();

    await expect(service.getCsvExport("sales")).rejects.toThrow(
      "from and to are required",
    );
  });
});
