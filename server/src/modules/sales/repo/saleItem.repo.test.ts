import { describe, expect, it, vi } from "vitest";

import { SaleItemRepo } from "./saleItem.repo.ts";

function buildRepo(rows: unknown[] = []) {
  const session = vi.fn().mockResolvedValue(rows);
  const aggregate = vi.fn().mockReturnValue({ session });
  const exists = vi.fn().mockResolvedValue({ _id: "sale-item-1" });
  return {
    repo: new SaleItemRepo({ aggregate, exists } as never),
    aggregate,
    exists,
  };
}

describe("SaleItemRepo reporting", () => {
  it("excludes returned units from top selling", async () => {
    const { repo, aggregate } = buildRepo([
      {
        medicineId: { toString: () => "medicine-1" },
        medicineName: "Paracetamol",
        strength: "500mg",
        totalQuantitySold: 7,
        totalRevenue: 630,
      },
    ]);

    const result = await repo.getTopSellingMedicines(10);

    expect(result).toEqual([
      {
        medicineId: "medicine-1",
        medicineName: "Paracetamol",
        strength: "500mg",
        totalQuantitySold: 7,
        totalRevenue: 630,
      },
    ]);

    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $addFields: {
        netQuantity: {
          $subtract: ["$quantity", { $ifNull: ["$returnedQuantity", 0] }],
        },
      },
    });
    expect(pipeline).toContainEqual({
      $match: { netQuantity: { $gt: 0 } },
    });
    expect(pipeline).toContainEqual({
      $match: { "sale.status": { $ne: "CANCELLED" } },
    });
  });

  it("computes COGS from batch purchase price and unreturned units", async () => {
    const { repo, aggregate } = buildRepo([{ cogs: 500.5 }]);

    await expect(
      repo.getCogsInRange(
        new Date("2026-02-01T00:00:00Z"),
        new Date("2026-03-01T00:00:00Z"),
      ),
    ).resolves.toBe(500.5);

    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: {
        "sale.status": { $ne: "CANCELLED" },
        "sale.saleDate": {
          $gte: new Date("2026-02-01T00:00:00Z"),
          $lt: new Date("2026-03-01T00:00:00Z"),
        },
      },
    });
    expect(pipeline).toContainEqual({
      $lookup: {
        from: "batches",
        localField: "batchId",
        foreignField: "_id",
        as: "batch",
      },
    });

    // Only GOOD returns restore stock and therefore reverse COGS.
    const returnsLookup = pipeline.find(
      (stage) =>
        (stage["$lookup"] as { from?: string } | undefined)?.from ===
        "returns",
    ) as { $lookup: { pipeline: Array<Record<string, unknown>> } };
    expect(returnsLookup.$lookup.pipeline).toContainEqual({
      $match: { status: "COMPLETED" },
    });
    expect(returnsLookup.$lookup.pipeline).toContainEqual({
      $match: {
        $expr: {
          $and: [
            { $eq: ["$returnItems.saleItemId", "$$saleItemId"] },
            { $eq: ["$returnItems.condition", "GOOD"] },
          ],
        },
      },
    });

    // Prefer the sale-time cost snapshot, falling back to the batch for
    // legacy sale items.
    expect(pipeline).toContainEqual({
      $group: {
        _id: null,
        cogs: {
          $sum: {
            $multiply: [
              "$netQuantity",
              {
                $ifNull: [
                  "$purchasePrice",
                  { $ifNull: ["$batch.purchasePrice", 0] },
                ],
              },
            ],
          },
        },
      },
    });
  });

  it("detects whether a batch is referenced by sales", async () => {
    const { repo, exists } = buildRepo();

    await expect(
      repo.existsByBatchId("507f1f77bcf86cd799439021"),
    ).resolves.toBe(true);
    expect(exists).toHaveBeenCalledWith({
      batchId: "507f1f77bcf86cd799439021",
    });
  });
});
