import { describe, expect, it, vi } from "vitest";

import { PurchaseOrderRepo } from "./purchaseOrder.repo.ts";

function buildRepo(rows: unknown[] = []) {
  const session = vi.fn().mockResolvedValue(rows);
  const aggregate = vi.fn().mockReturnValue({ session });
  return {
    repo: new PurchaseOrderRepo({ aggregate } as never),
    aggregate,
  };
}

describe("PurchaseOrderRepo reporting", () => {
  it("sums non-cancelled orders by orderDate in a half-open range", async () => {
    const { repo, aggregate } = buildRepo([{ total: 508.5 }]);

    await expect(
      repo.getTotalPurchasesInRange(
        new Date("2026-02-01T00:00:00Z"),
        new Date("2026-03-01T00:00:00Z"),
      ),
    ).resolves.toBe(508.5);

    const pipeline = aggregate.mock.calls[0]?.[0] as Array<
      Record<string, unknown>
    >;
    expect(pipeline).toContainEqual({
      $match: {
        status: { $ne: "cancelled" },
        orderDate: {
          $gte: new Date("2026-02-01T00:00:00Z"),
          $lt: new Date("2026-03-01T00:00:00Z"),
        },
      },
    });
  });

  it("returns zero when there are no matching orders", async () => {
    const { repo } = buildRepo([]);

    await expect(
      repo.getTotalPurchasesInRange(new Date(), new Date()),
    ).resolves.toBe(0);
  });
});
