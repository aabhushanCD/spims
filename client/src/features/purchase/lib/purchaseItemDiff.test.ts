import { describe, expect, it } from "vitest";

import type { PurchaseForm } from "../schema/purchase.schema";
import type { PurchaseDetailsItem } from "../types/PurchaseDetails";
import { buildPurchaseItemChanges } from "./purchaseItemDiff";

const original = (
  id: string,
  medicineId: string,
  quantity: number,
  purchasePrice: number,
): PurchaseDetailsItem => ({
  _id: id,
  medicine: { _id: medicineId, medicineName: "Medicine" },
  quantity,
  receivedQuantity: 0,
  quantityRemaining: quantity,
  purchasePrice,
  subtotal: quantity * purchasePrice,
});

const originals = [
  original("item-1", "medicine-1", 10, 5),
  original("item-2", "medicine-2", 4, 2),
];

function formItem(
  purchaseOrderItemId: string | undefined,
  medicineId: string,
  quantity: number,
  purchasePrice: number,
): PurchaseForm["items"][number] {
  return { purchaseOrderItemId, medicineId, quantity, purchasePrice };
}

describe("buildPurchaseItemChanges", () => {
  it("returns no changes when the form matches the order", () => {
    expect(
      buildPurchaseItemChanges(
        [
          formItem("item-1", "medicine-1", 10, 5),
          formItem("item-2", "medicine-2", 4, 2),
        ],
        originals,
      ),
    ).toEqual({ removals: [], updates: [], additions: [] });
  });

  it("detects quantity and price updates", () => {
    const changes = buildPurchaseItemChanges(
      [
        formItem("item-1", "medicine-1", 12, 5.5),
        formItem("item-2", "medicine-2", 4, 2),
      ],
      originals,
    );

    expect(changes.updates).toEqual([
      { itemId: "item-1", patch: { quantity: 12, purchasePrice: 5.5 } },
    ]);
  });

  it("detects additions", () => {
    const changes = buildPurchaseItemChanges(
      [
        formItem("item-1", "medicine-1", 10, 5),
        formItem("item-2", "medicine-2", 4, 2),
        formItem(undefined, "medicine-3", 2, 7),
      ],
      originals,
    );

    expect(changes.additions).toEqual([
      { medicineId: "medicine-3", quantity: 2, purchasePrice: 7 },
    ]);
  });

  it("detects removals", () => {
    const changes = buildPurchaseItemChanges(
      [formItem("item-1", "medicine-1", 10, 5)],
      originals,
    );

    expect(changes.removals).toEqual(["item-2"]);
  });

  it("supports removing and re-adding the same medicine", () => {
    const changes = buildPurchaseItemChanges(
      [
        formItem("item-1", "medicine-1", 10, 5),
        formItem(undefined, "medicine-2", 4, 2),
      ],
      originals,
    );

    expect(changes.removals).toEqual(["item-2"]);
    expect(changes.additions).toEqual([
      { medicineId: "medicine-2", quantity: 4, purchasePrice: 2 },
    ]);
  });

  it("rejects a stale item id", () => {
    expect(() =>
      buildPurchaseItemChanges(
        [formItem("missing", "medicine-1", 10, 5)],
        originals,
      ),
    ).toThrow("Purchase order item no longer exists");
  });
});
