import { describe, expect, it } from "vitest";

import { buildActionItems } from "./actionCenter";

const emptyInput = {
  summary: { lowStockCount: 0, outOfStockCount: 0 },
  expiry: { expiringSoonCount: 0, batchesAwaitingDisposal: 0 },
  reorder: { pendingCount: 0 },
  notifications: { failedDeliveries: 0 },
};

describe("buildActionItems", () => {
  it("drops groups that are at zero", () => {
    expect(buildActionItems(emptyInput, "owner")).toEqual([]);
  });

  it("aggregates stock and expiry counts with severity", () => {
    const items = buildActionItems(
      {
        summary: { lowStockCount: 3, outOfStockCount: 2 },
        expiry: { expiringSoonCount: 4, batchesAwaitingDisposal: 0 },
        reorder: { pendingCount: 0 },
        notifications: { failedDeliveries: 0 },
      },
      "owner",
    );

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "stock",
      count: 5,
      detail: "3 low · 2 out",
      href: "/stock",
      severity: "critical",
    });
    expect(items[1]).toMatchObject({
      id: "expiry",
      count: 4,
      href: "/batches",
      severity: "warning",
    });
  });

  it("orders critical items before warnings and info", () => {
    const items = buildActionItems(
      {
        summary: { lowStockCount: 1, outOfStockCount: 0 },
        expiry: { expiringSoonCount: 0, batchesAwaitingDisposal: 2 },
        reorder: { pendingCount: 9 },
        notifications: { failedDeliveries: 1 },
      },
      "owner",
    );

    expect(items.map((item) => item.id)).toEqual([
      "expiry",
      "stock",
      "notifications",
      "reorder",
    ]);
  });

  it("routes notification failures by role", () => {
    const input = {
      ...emptyInput,
      notifications: { failedDeliveries: 2 },
    };

    expect(buildActionItems(input, "owner")[0].href).toBe(
      "/notifications/admin",
    );
    expect(buildActionItems(input, "pharmacist")[0].href).toBe(
      "/notifications/admin",
    );
    expect(buildActionItems(input, "inventory_manager")[0].href).toBe(
      "/notifications",
    );
  });
});
