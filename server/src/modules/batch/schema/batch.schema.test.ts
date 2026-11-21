import { describe, expect, it } from "vitest";

import {
  batchAdjustSchema,
  batchQuantitySchema,
  createBatchSchema,
  lowStockQuerySchema,
  updateBatchSchema,
} from "./batch.schema.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const PURCHASE_ID = "507f1f77bcf86cd799439012";

function validBatch() {
  return {
    medicineId: MEDICINE_ID,
    purchaseOrderId: PURCHASE_ID,
    batchNumber: " BATCH-1 ",
    expiryDate: "2027-12-31",
    manufacturingDate: "2026-01-01",
    purchasePrice: 10,
    sellingPrice: 15,
    quantityReceived: 20,
    referenceId: PURCHASE_ID,
    referenceType: "PURCHASE_ORDER",
    remarks: "Initial receipt",
  };
}

describe("batch schemas", () => {
  it("parses a valid batch and preserves movement metadata", () => {
    const parsed = createBatchSchema.parse(validBatch());

    expect(parsed.batchNumber).toBe("BATCH-1");
    expect(parsed.expiryDate).toBeInstanceOf(Date);
    expect(parsed.manufacturingDate).toBeInstanceOf(Date);
    expect(parsed.referenceId).toBe(PURCHASE_ID);
    expect(parsed.referenceType).toBe("PURCHASE_ORDER");
    expect(parsed.remarks).toBe("Initial receipt");
  });

  it("rejects malformed ObjectIds", () => {
    expect(() =>
      createBatchSchema.parse({ ...validBatch(), medicineId: "not-an-id" }),
    ).toThrow();
  });

  it("rejects a non-positive quantity received", () => {
    expect(() =>
      createBatchSchema.parse({ ...validBatch(), quantityReceived: 0 }),
    ).toThrow();
  });

  it("rejects an invalid date", () => {
    expect(() =>
      createBatchSchema.parse({ ...validBatch(), expiryDate: "not-a-date" }),
    ).toThrow();
  });

  it("accepts a partial update with a movement type", () => {
    const parsed = updateBatchSchema.parse({
      sellingPrice: 22,
      quantityRemaining: 3,
      movementType: "ADJUSTMENT",
    });

    expect(parsed).toMatchObject({
      sellingPrice: 22,
      quantityRemaining: 3,
      movementType: "ADJUSTMENT",
    });
  });

  it("rejects a negative remaining quantity on update", () => {
    expect(() =>
      updateBatchSchema.parse({ quantityRemaining: -1 }),
    ).toThrow();
  });

  it("validates stock action quantities", () => {
    expect(batchQuantitySchema.parse({ quantity: 2 })).toEqual({ quantity: 2 });
    expect(() => batchQuantitySchema.parse({ quantity: 0 })).toThrow();
    expect(batchAdjustSchema.parse({ quantity: 0 })).toEqual({ quantity: 0 });
    expect(() => batchAdjustSchema.parse({ quantity: -1 })).toThrow();
  });

  it("parses and defaults the low-stock threshold", () => {
    expect(lowStockQuerySchema.parse({})).toEqual({ threshold: 10 });
    expect(lowStockQuerySchema.parse({ threshold: "5" })).toEqual({
      threshold: 5,
    });
    expect(() => lowStockQuerySchema.parse({ threshold: "-1" })).toThrow();
  });
});
