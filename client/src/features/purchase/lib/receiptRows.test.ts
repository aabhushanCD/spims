import { describe, expect, it } from "vitest";

import {
  sumReceiptQuantities,
  validateReceiptTotals,
} from "./receiptRows";

describe("receiptRows", () => {
  it("sums multiple batches for the same purchase-order item", () => {
    const totals = sumReceiptQuantities([
      { purchaseOrderItemId: "item-1", quantityReceived: 3 },
      { purchaseOrderItemId: "item-1", quantityReceived: 2 },
      { purchaseOrderItemId: "item-2", quantityReceived: 1 },
    ]);

    expect(totals.get("item-1")).toBe(5);
    expect(totals.get("item-2")).toBe(1);
  });

  it("accepts totals within the remaining quantity", () => {
    expect(
      validateReceiptTotals(
        [{ purchaseOrderItemId: "item-1", quantityReceived: 5 }],
        new Map([["item-1", 5]]),
      ),
    ).toBeNull();
  });

  it("rejects an over-receipt across multiple rows", () => {
    expect(
      validateReceiptTotals(
        [
          { purchaseOrderItemId: "item-1", quantityReceived: 4 },
          { purchaseOrderItemId: "item-1", quantityReceived: 4 },
        ],
        new Map([["item-1", 5]]),
        new Map([["item-1", "Paracetamol"]]),
      ),
    ).toMatch(/remaining 5 for Paracetamol/);
  });

  it("rejects a row for an unknown item", () => {
    expect(
      validateReceiptTotals(
        [{ purchaseOrderItemId: "missing", quantityReceived: 1 }],
        new Map(),
      ),
    ).toMatch(/does not match/);
  });
});
