import { describe, expect, it } from "vitest";

import { receivePurchaseSchema } from "./receivePurchase.schema";

const validItem = {
  purchaseOrderItemId: "507f1f77bcf86cd799439011",
  medicineId: "507f1f77bcf86cd799439012",
  quantityReceived: 5,
  sellingPrice: 15,
  batchNumber: "B-1",
  manufacturingDate: "2026-01-01",
  expiryDate: "2027-01-01",
  remarks: "",
};

describe("receivePurchaseSchema", () => {
  it("accepts a valid receipt line", () => {
    expect(
      receivePurchaseSchema.safeParse({ items: [validItem] }).success,
    ).toBe(true);
  });

  it("requires the purchase-order item id", () => {
    const withoutId = {
      medicineId: validItem.medicineId,
      quantityReceived: validItem.quantityReceived,
      sellingPrice: validItem.sellingPrice,
      batchNumber: validItem.batchNumber,
      manufacturingDate: validItem.manufacturingDate,
      expiryDate: validItem.expiryDate,
      remarks: validItem.remarks,
    };

    expect(
      receivePurchaseSchema.safeParse({ items: [withoutId] }).success,
    ).toBe(false);
  });

  it("requires a real manufacturing date", () => {
    expect(
      receivePurchaseSchema.safeParse({
        items: [{ ...validItem, manufacturingDate: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects fractional quantities", () => {
    expect(
      receivePurchaseSchema.safeParse({
        items: [{ ...validItem, quantityReceived: 1.5 }],
      }).success,
    ).toBe(false);
  });

  it("rejects a percentage-style selling price of zero", () => {
    expect(
      receivePurchaseSchema.safeParse({
        items: [{ ...validItem, sellingPrice: 0 }],
      }).success,
    ).toBe(false);
  });
});
