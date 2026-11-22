import { describe, expect, it } from "vitest";

import type { SaleInvoicePayload } from "../types/sale.types";
import { mapInvoiceToSaleDetails } from "./invoiceMapper";

const basePayload: SaleInvoicePayload = {
  sale: {
    _id: "sale-1",
    invoiceNumber: "INV-1",
    customerName: "Walk-in",
    paymentMethod: "CASH",
    status: "COMPLETED",
    saleDate: "2026-02-10T10:00:00.000Z",
    subTotal: 100,
    discount: 0,
    VAT: 13,
    totalAmount: 113,
  },
  items: [
    {
      _id: "item-1",
      medicineId: {
        _id: "medicine-1",
        medicineName: "Paracetamol",
      },
      batchId: {
        _id: "batch-1",
        batchNumber: "B-2026-01",
        expiryDate: "2027-01-01T00:00:00.000Z",
        sellingPrice: 10,
      },
      quantity: 10,
      unitPrice: 10,
      discount: 0,
      totalPrice: 100,
      vatRate: 13,
    },
  ],
  summary: {
    totalAmount: 113,
    paidAmount: 113,
    amountDue: 0,
  },
};

describe("mapInvoiceToSaleDetails", () => {
  it("maps the populated FEFO batch onto the sale line", () => {
    const sale = mapInvoiceToSaleDetails(basePayload);

    expect(sale.items[0]).toMatchObject({
      id: "item-1",
      medicineName: "Paracetamol",
      batchNumber: "B-2026-01",
      batchExpiryDate: "2027-01-01T00:00:00.000Z",
    });
  });

  it("ignores an unpopulated batch id", () => {
    const sale = mapInvoiceToSaleDetails({
      ...basePayload,
      items: [
        {
          ...basePayload.items[0],
          batchId: "batch-1",
        },
      ],
    });

    expect(sale.items[0]?.batchNumber).toBeUndefined();
  });

  it("ignores a null batch id", () => {
    const sale = mapInvoiceToSaleDetails({
      ...basePayload,
      items: [
        {
          ...basePayload.items[0],
          batchId: null,
        },
      ],
    });

    expect(sale.items[0]?.batchNumber).toBeUndefined();
    expect(sale.items[0]?.batchExpiryDate).toBeUndefined();
  });

  it("maps the payment summary", () => {
    const sale = mapInvoiceToSaleDetails(basePayload);

    expect(sale.paidAmount).toBe(113);
    expect(sale.amountDue).toBe(0);
  });

  it("falls back to the sale total when the summary is missing", () => {
    const withoutSummary = { ...basePayload };
    delete (withoutSummary as Partial<SaleInvoicePayload>).summary;

    const sale = mapInvoiceToSaleDetails(withoutSummary);

    expect(sale.paidAmount).toBe(0);
    expect(sale.amountDue).toBe(113);
  });
});
