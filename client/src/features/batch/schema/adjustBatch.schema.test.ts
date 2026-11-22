import { describe, expect, it } from "vitest";

import { adjustBatchSchema } from "./adjustBatch.schema";

describe("adjustBatchSchema", () => {
  it("accepts a whole number and remarks", () => {
    expect(
      adjustBatchSchema.safeParse({ quantity: 4, remarks: "counted" }).success,
    ).toBe(true);
  });

  it("coerces numeric input", () => {
    const parsed = adjustBatchSchema.parse({ quantity: "4", remarks: "" });

    expect(parsed.quantity).toBe(4);
  });

  it("rejects negative and fractional quantities", () => {
    expect(adjustBatchSchema.safeParse({ quantity: -1 }).success).toBe(false);
    expect(adjustBatchSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
  });

  it("rejects remarks over 500 characters", () => {
    expect(
      adjustBatchSchema.safeParse({
        quantity: 1,
        remarks: "a".repeat(501),
      }).success,
    ).toBe(false);
  });
});
