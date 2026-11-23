import { describe, expect, it } from "vitest";

import {
  bestRevenueMonth,
  hasRevenue,
  isNewPharmacy,
  totalRevenue,
} from "./dashboardState";

const months = [
  { month: 1, total: 0, count: 0 },
  { month: 2, total: 1200, count: 3 },
  { month: 3, total: 800, count: 2 },
];

describe("isNewPharmacy", () => {
  it("is true only when there are no batches and no movements", () => {
    expect(isNewPharmacy({ totalMedicineBatches: 0 }, [])).toBe(true);
    expect(isNewPharmacy({ totalMedicineBatches: 1 }, [])).toBe(false);
    expect(
      isNewPharmacy({ totalMedicineBatches: 0 }, [
        {
          _id: "movement-1",
          movementType: "SALE",
          quantity: 1,
          remarks: "",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    ).toBe(false);
  });
});

describe("revenue helpers", () => {
  it("detects whether any month has revenue", () => {
    expect(hasRevenue([{ month: 1, total: 0, count: 0 }])).toBe(false);
    expect(hasRevenue(months)).toBe(true);
  });

  it("sums the monthly series", () => {
    expect(totalRevenue(months)).toBe(2000);
  });

  it("returns the best non-zero month", () => {
    expect(bestRevenueMonth(months)).toEqual({
      month: 2,
      total: 1200,
      count: 3,
    });
    expect(bestRevenueMonth([{ month: 1, total: 0, count: 0 }])).toBeNull();
  });
});
