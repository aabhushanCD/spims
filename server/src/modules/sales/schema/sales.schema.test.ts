import { describe, expect, it } from "vitest";

import {
  createSaleSchema,
  updateSaleItemSchema,
  updateSaleSchema,
} from "./sales.schema.ts";

const MEDICINE_ID = "507f1f77bcf86cd799439011";
const BATCH_ID = "507f1f77bcf86cd799439021";

describe("sales schemas", () => {
  it("validates sale item ObjectIds", () => {
    const parsed = createSaleSchema.parse({
      customerName: "  Walk-in  ",
      paymentMethod: "CASH",
      saleDate: "2026-01-15",
      items: [
        {
          batchId: BATCH_ID,
          medicineId: MEDICINE_ID,
          quantity: 2,
        },
      ],
    });

    expect(parsed.customerName).toBe("Walk-in");
    expect(parsed.items[0]).toMatchObject({
      discountPercentage: 0,
    });
  });

  it("rejects malformed item ObjectIds", () => {
    expect(() =>
      createSaleSchema.parse({
        customerName: "Walk-in",
        paymentMethod: "CASH",
        saleDate: new Date(),
        items: [
          {
            batchId: "bad",
            medicineId: MEDICINE_ID,
            quantity: 1,
          },
        ],
      }),
    ).toThrow();
  });

  it("allows only editable sale fields", () => {
    expect(
      updateSaleSchema.parse({ paymentMethod: "CARD" }),
    ).toEqual({ paymentMethod: "CARD" });
    expect(() => updateSaleSchema.parse({})).toThrow();
    expect(() =>
      updateSaleSchema.parse({ customerName: "", discount: 10 }),
    ).toThrow();
  });

  it("requires at least one sale-item correction", () => {
    expect(updateSaleItemSchema.parse({ discount: 5 })).toEqual({
      discount: 5,
    });
    expect(() => updateSaleItemSchema.parse({})).toThrow();
    expect(() => updateSaleItemSchema.parse({ unitPrice: 0 })).toThrow();
  });
});
