import { describe, expect, it } from "vitest";

import { createReturnSchema } from "./createReturn.schema";

const base = {
  salesId: "507f1f77bcf86cd799439011",
  returnReason: "Customer changed medication",
  returnedBy: "507f1f77bcf86cd799439012",
  returnDate: "2026-02-11",
  items: [
    {
      saleItemId: "507f1f77bcf86cd799439013",
      quantity: 1,
      condition: "GOOD" as const,
    },
  ],
};

describe("createReturnSchema", () => {
  it("accepts a valid return", () => {
    expect(createReturnSchema.safeParse(base).success).toBe(true);
  });

  it("requires a reason of at least three characters", () => {
    expect(
      createReturnSchema.safeParse({ ...base, returnReason: "no" }).success,
    ).toBe(false);
  });

  it("requires at least one item", () => {
    expect(
      createReturnSchema.safeParse({ ...base, items: [] }).success,
    ).toBe(false);
  });

  it("rejects fractional quantities", () => {
    expect(
      createReturnSchema.safeParse({
        ...base,
        items: [{ ...base.items[0], quantity: 1.5 }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown condition", () => {
    expect(
      createReturnSchema.safeParse({
        ...base,
        items: [{ ...base.items[0], condition: "LOST" }],
      }).success,
    ).toBe(false);
  });
});
