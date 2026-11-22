import { describe, expect, it } from "vitest";

import { purchaseSchema } from "./purchase.schema";

const base = {
  supplierId: "507f1f77bcf86cd799439011",
  orderDate: new Date("2026-01-01"),
  invoiceNumber: "INV-1",
  discount: 0,
  VAT: 13,
  items: [
    {
      medicineId: "507f1f77bcf86cd799439012",
      quantity: 1,
      purchasePrice: 10,
    },
  ],
};

describe("purchaseSchema", () => {
  it("accepts a null delivery date and normalizes it to undefined", () => {
    const parsed = purchaseSchema.parse({
      ...base,
      expectedDeliveryDate: null,
    });

    expect(parsed.expectedDeliveryDate).toBeUndefined();
  });

  it("accepts a real delivery date", () => {
    const date = new Date("2026-02-01");
    const parsed = purchaseSchema.parse({
      ...base,
      expectedDeliveryDate: date,
    });

    expect(parsed.expectedDeliveryDate).toEqual(date);
  });

  it("accepts an omitted delivery date", () => {
    const parsed = purchaseSchema.parse(base);

    expect(parsed.expectedDeliveryDate).toBeUndefined();
  });
});
