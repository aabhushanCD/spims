import { describe, expect, it } from "vitest";
import SalesItem from "../modules/sales/model/salesItem.model.ts";
import Return from "../modules/sales/model/return.model.ts";
import PurchaseOrder from "../modules/purchase/model/purchaseOrder.model.ts";
import Sales from "../modules/sales/model/sales.model.ts";
import Supplier from "../modules/supplier/model/supplier.model.ts";
import SmartReorder from "../modules/smartReorder/model/smartReorder.model.ts";
import { Medicine } from "../modules/medicine/models/medicine.model.ts";

function keys(model: { schema: { indexes: () => [Record<string, unknown>, ...unknown[]][] } }) {
  return model.schema.indexes().map(([spec]) => JSON.stringify(spec));
}

describe("Phase 5 indexes", () => {
  it("indexes sale items for sales, batch, and medicine history", () => {
    expect(keys(SalesItem)).toEqual(
      expect.arrayContaining([
        JSON.stringify({ salesId: 1 }),
        JSON.stringify({ batchId: 1 }),
        JSON.stringify({ medicineId: 1, createdAt: -1 }),
      ]),
    );
  });

  it("indexes returns for sale, status, and date queries", () => {
    expect(keys(Return)).toEqual(
      expect.arrayContaining([
        JSON.stringify({ salesId: 1 }),
        JSON.stringify({ status: 1, returnDate: -1 }),
        JSON.stringify({ returnDate: -1 }),
      ]),
    );
  });

  it("indexes purchases for supplier, status, and order date", () => {
    expect(keys(PurchaseOrder)).toEqual(
      expect.arrayContaining([
        JSON.stringify({ supplierId: 1, orderDate: -1 }),
        JSON.stringify({ status: 1, orderDate: -1 }),
        JSON.stringify({ orderDate: -1 }),
      ]),
    );
  });

  it("indexes sales status/date and idempotency keys", () => {
    expect(keys(Sales)).toEqual(
      expect.arrayContaining([
        JSON.stringify({ status: 1, saleDate: -1 }),
        JSON.stringify({ cashierId: 1, saleDate: -1 }),
        JSON.stringify({ idempotencyKey: 1 }),
      ]),
    );

    const idempotencyIndex = Sales.schema
      .indexes()
      .find(
        ([spec]) =>
          JSON.stringify(spec) === JSON.stringify({ idempotencyKey: 1 }),
      );
    expect(idempotencyIndex?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { idempotencyKey: { $type: "string" } },
    });
  });

  it("allows multiple medicines without a barcode", () => {
    const barcodeIndex = Medicine.schema
      .indexes()
      .find(([spec]) => JSON.stringify(spec) === JSON.stringify({ barcode: 1 }));
    expect(barcodeIndex?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { barcode: { $type: "string" } },
    });
  });

  it("keeps supplier phone and smart-reorder pending rows unique", () => {
    expect(keys(Supplier)).toContain(JSON.stringify({ phone: 1 }));
    const pendingIndex = SmartReorder.schema
      .indexes()
      .find(([spec]) => JSON.stringify(spec) === JSON.stringify({ medicineId: 1 }));
    expect(pendingIndex?.[1]).toMatchObject({
      unique: true,
      partialFilterExpression: { status: "PENDING" },
    });
  });
});
