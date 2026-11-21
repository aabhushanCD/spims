import { describe, expect, it } from "vitest";

import {
  createPurchaseOrderItemSchema,
  updatePurchaseOrderItemSchema,
} from "./purchaseOrderItem.schema.ts";
import { createPurchaseOrderSchema } from "./purchaseOrder.schema.ts";
import { receivePurchaseOrderSchema } from "./receivePurchaseOrder.schema.ts";

const SUPPLIER_ID = "507f1f77bcf86cd799439011";
const MEDICINE_ID = "507f1f77bcf86cd799439021";
const OTHER_MEDICINE_ID = "507f1f77bcf86cd799439031";

function validReceiveItem(medicineId = MEDICINE_ID) {
  return {
    medicineId,
    batchNumber: "B-1",
    manufacturingDate: "2026-01-01",
    expiryDate: "2027-01-01",
    sellingPrice: 15,
    quantityReceived: 10,
  };
}

describe("purchase schemas", () => {
  it("accepts optional delivery and receipt dates", () => {
    const parsed = createPurchaseOrderSchema.parse({
      supplierId: SUPPLIER_ID,
      orderDate: "2026-01-01",
      invoiceNumber: "INV-1",
      items: [
        {
          medicineId: MEDICINE_ID,
          quantity: 2,
          purchasePrice: 10,
        },
      ],
    });

    expect(parsed.expectedDeliveryDate).toBeUndefined();
    expect(parsed.receivedDate).toBeUndefined();
    expect(parsed.VAT).toBe(13);
  });

  it("requires at least one purchase order item", () => {
    expect(() =>
      createPurchaseOrderSchema.parse({
        supplierId: SUPPLIER_ID,
        orderDate: new Date(),
        invoiceNumber: "INV-1",
        items: [],
      }),
    ).toThrow();
  });

  it("does not require purchaseOrderId in an item body", () => {
    expect(
      createPurchaseOrderItemSchema.parse({
        medicineId: MEDICINE_ID,
        quantity: 1,
        purchasePrice: 10,
      }),
    ).toEqual({
      medicineId: MEDICINE_ID,
      quantity: 1,
      purchasePrice: 10,
    });
  });

  it("requires at least one field on item updates", () => {
    expect(updatePurchaseOrderItemSchema.parse({ quantity: 2 })).toEqual({
      quantity: 2,
    });
    expect(() => updatePurchaseOrderItemSchema.parse({})).toThrow();
  });

  it("validates receive bodies and rejects duplicate medicines", () => {
    const parsed = receivePurchaseOrderSchema.parse({
      items: [validReceiveItem()],
    });

    expect(parsed.items[0]?.manufacturingDate).toBeInstanceOf(Date);
    expect(parsed.items[0]?.remarks).toBe("");
    expect(() =>
      receivePurchaseOrderSchema.parse({
        items: [validReceiveItem(), validReceiveItem()],
      }),
    ).toThrow();
    expect(() =>
      receivePurchaseOrderSchema.parse({
        items: [validReceiveItem(OTHER_MEDICINE_ID)],
      }),
    ).not.toThrow();
  });
});
