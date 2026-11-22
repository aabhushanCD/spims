import { describe, expect, it } from "vitest";

import type { SaleFormValues } from "../schema/sale.schema";
import { toCreateSalePayload } from "./salePayload";

const values: SaleFormValues = {
  customerName: "Walk-in",
  paymentMethod: "CASH",
  discount: 0,
  discountPercentage: 0,
  items: [
    {
      medicineId: "507f1f77bcf86cd799439011",
      medicineName: "Paracetamol",
      batchId: "507f1f77bcf86cd799439099",
      batchNo: "B-1",
      vatPercentage: 13,
      quantity: 2,
      discountPercentage: 5,
      unitPrice: 10,
      availableStock: 20,
    },
  ],
};

describe("toCreateSalePayload", () => {
  it("omits the batch so the server can allocate FEFO stock", () => {
    const payload = toCreateSalePayload(values, new Date("2026-02-10T10:00:00Z"));

    expect(payload.items).toEqual([
      {
        medicineId: "507f1f77bcf86cd799439011",
        quantity: 2,
        discountPercentage: 5,
      },
    ]);
    expect(payload.items[0]).not.toHaveProperty("batchId");
  });

  it("includes a linked customer id", () => {
    const payload = toCreateSalePayload(
      { ...values, customerId: "507f1f77bcf86cd799439055" },
      new Date("2026-02-10T10:00:00Z"),
    );

    expect(payload.customerId).toBe("507f1f77bcf86cd799439055");
  });

  it("sends only the fields the server accepts", () => {
    const payload = toCreateSalePayload(values, new Date("2026-02-10T10:00:00Z"));

    expect(payload).toEqual({
      customerName: "Walk-in",
      paymentMethod: "CASH",
      saleDate: "2026-02-10T10:00:00.000Z",
      discount: 0,
      items: [
        {
          medicineId: "507f1f77bcf86cd799439011",
          quantity: 2,
          discountPercentage: 5,
        },
      ],
    });
  });
});
