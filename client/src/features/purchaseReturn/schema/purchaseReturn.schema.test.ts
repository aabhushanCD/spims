import { describe, expect, it } from "vitest";

import { createPurchaseReturnSchema } from "./purchaseReturn.schema";

const base = {
  purchaseOrderId: "507f1f77bcf86cd799439011",
  returnReason: "Damaged on arrival",
  returnDate: "2026-02-11",
  items: [
    {
      batchId: "507f1f77bcf86cd799439012",
      quantity: 2,
    },
  ],
};

describe("createPurchaseReturnSchema", () => {
  it("accepts a valid return", () => {
    expect(createPurchaseReturnSchema.safeParse(base).success).toBe(true);
  });

  it("requires a reason of at least three characters", () => {
    expect(
      createPurchaseReturnSchema.safeParse({
        ...base,
        returnReason: "no",
      }).success,
    ).toBe(false);
  });

  it("requires at least one item", () => {
    expect(
      createPurchaseReturnSchema.safeParse({ ...base, items: [] }).success,
    ).toBe(false);
  });

  it("rejects fractional quantities", () => {
    expect(
      createPurchaseReturnSchema.safeParse({
        ...base,
        items: [{ ...base.items[0], quantity: 1.5 }],
      }).success,
    ).toBe(false);
  });
});
