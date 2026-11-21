import { describe, expect, it, vi } from "vitest";

import { SalesRepo } from "./sales.repo.ts";

function buildRepo(rows: unknown[] = []) {
  const session = vi.fn().mockResolvedValue(rows);
  const aggregate = vi.fn().mockReturnValue({ session });
  return {
    repo: new SalesRepo({ aggregate } as never),
    aggregate,
    session,
  };
}

describe("SalesRepo reporting", () => {
  it("sums gross sales and VAT by saleDate, excluding cancelled sales", async () => {
    const { repo, aggregate } = buildRepo([{ gross: 1130, vat: 130 }]);

    const result = await repo.getSalesTotalsInRange(
      new Date("2026-02-01T00:00:00Z"),
      new Date("2026-03-01T00:00:00Z"),
    );

    expect(result).toEqual({ gross: 1130, vat: 130 });
    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: {
        status: { $ne: "CANCELLED" },
        saleDate: {
          $gte: new Date("2026-02-01T00:00:00Z"),
          $lt: new Date("2026-03-01T00:00:00Z"),
        },
      },
    });
  });

  it("honours year and timezone for the monthly series", async () => {
    const { repo, aggregate } = buildRepo([
      { _id: 1, total: 100, count: 2 },
    ]);

    const result = await repo.getSalesByMonth({
      year: 2026,
      months: 12,
      timeZone: "Asia/Kathmandu",
      now: new Date("2026-02-15T00:00:00Z"),
    });

    expect(result).toEqual([
      { month: 1, total: 100, count: 2 },
      { month: 2, total: 0, count: 0 },
    ]);

    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $group: {
        _id: {
          $month: { date: "$saleDate", timezone: "Asia/Kathmandu" },
        },
        total: { $sum: "$totalAmount" },
        count: { $sum: 1 },
      },
    });
    expect(pipeline).toContainEqual({
      $match: {
        status: { $ne: "CANCELLED" },
        saleDate: {
          $gte: new Date("2025-12-31T18:15:00.000Z"),
          $lt: new Date("2026-12-31T18:15:00.000Z"),
        },
      },
    });
  });

  it("returns a full year for past years", async () => {
    const { repo, aggregate } = buildRepo([]);

    const result = await repo.getSalesByMonth({
      year: 2025,
      timeZone: "UTC",
      now: new Date("2026-02-15T00:00:00Z"),
    });

    expect(result).toHaveLength(12);
    expect(aggregate).toHaveBeenCalledTimes(1);
  });

  it("does not query for a future year", async () => {
    const { repo, aggregate } = buildRepo([]);

    const result = await repo.getSalesByMonth({
      year: 2027,
      timeZone: "UTC",
      now: new Date("2026-02-15T00:00:00Z"),
    });

    expect(result).toEqual([]);
    expect(aggregate).not.toHaveBeenCalled();
  });
});
