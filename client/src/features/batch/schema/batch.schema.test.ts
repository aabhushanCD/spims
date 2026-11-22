import { describe, expect, it } from "vitest";

import {
  createBatchFormSchema,
  updateBatchFormSchema,
} from "./batch.schema";

const base = {
  batchNumber: "B-1",
  manufacturingDate: "2026-01-01",
  expiryDate: "2027-01-01",
  purchasePrice: 10,
  sellingPrice: 15,
};

describe("createBatchFormSchema", () => {
  it("accepts a valid batch", () => {
    expect(
      createBatchFormSchema.safeParse({
        ...base,
        purchaseOrderId: "507f1f77bcf86cd799439011",
        medicineId: "507f1f77bcf86cd799439012",
        quantityReceived: 10,
      }).success,
    ).toBe(true);
  });

  it("requires a purchase order and medicine", () => {
    expect(
      createBatchFormSchema.safeParse({
        ...base,
        quantityReceived: 10,
      }).success,
    ).toBe(false);
  });

  it("rejects an expiry date before manufacturing", () => {
    expect(
      createBatchFormSchema.safeParse({
        ...base,
        purchaseOrderId: "507f1f77bcf86cd799439011",
        medicineId: "507f1f77bcf86cd799439012",
        quantityReceived: 10,
        expiryDate: "2025-01-01",
      }).success,
    ).toBe(false);
  });

  it("rejects a zero selling price", () => {
    expect(
      createBatchFormSchema.safeParse({
        ...base,
        purchaseOrderId: "507f1f77bcf86cd799439011",
        medicineId: "507f1f77bcf86cd799439012",
        quantityReceived: 10,
        sellingPrice: 0,
      }).success,
    ).toBe(false);
  });
});

describe("updateBatchFormSchema", () => {
  it("accepts editable fields", () => {
    expect(
      updateBatchFormSchema.safeParse({
        ...base,
        quantityRemaining: 4,
        isActive: true,
      }).success,
    ).toBe(true);
  });

  it("rejects a negative remaining quantity", () => {
    expect(
      updateBatchFormSchema.safeParse({
        ...base,
        quantityRemaining: -1,
      }).success,
    ).toBe(false);
  });
});
