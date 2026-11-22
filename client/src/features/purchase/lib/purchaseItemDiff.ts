import type { PurchaseForm } from "../schema/purchase.schema";
import type { PurchaseDetailsItem } from "../types/PurchaseDetails";

export interface PurchaseItemPatch {
  quantity?: number;
  purchasePrice?: number;
}

export interface PurchaseItemUpdate {
  itemId: string;
  patch: PurchaseItemPatch;
}

export interface PurchaseItemAddition {
  medicineId: string;
  quantity: number;
  purchasePrice: number;
}

export interface PurchaseItemChanges {
  removals: string[];
  updates: PurchaseItemUpdate[];
  additions: PurchaseItemAddition[];
}

/**
 * Builds the item-level diff for a pending purchase order.
 *
 * Removals are returned separately so the caller can apply them before
 * additions. That ordering lets a user remove an item and add a replacement
 * for the same medicine without tripping the duplicate-medicine guard.
 */
export function buildPurchaseItemChanges(
  items: PurchaseForm["items"],
  originalItems: PurchaseDetailsItem[],
): PurchaseItemChanges {
  const originalById = new Map(
    originalItems.map((item) => [item._id, item]),
  );
  const submittedIds = new Set(
    items
      .map((item) => item.purchaseOrderItemId)
      .filter((id): id is string => Boolean(id)),
  );

  const removals = originalItems
    .filter((item) => !submittedIds.has(item._id))
    .map((item) => item._id);

  const updates: PurchaseItemUpdate[] = [];
  const additions: PurchaseItemAddition[] = [];

  for (const item of items) {
    if (item.purchaseOrderItemId) {
      const original = originalById.get(item.purchaseOrderItemId);

      if (!original) {
        throw new Error("Purchase order item no longer exists");
      }

      const patch: PurchaseItemPatch = {};
      if (item.quantity !== original.quantity) {
        patch.quantity = item.quantity;
      }
      if (item.purchasePrice !== original.purchasePrice) {
        patch.purchasePrice = item.purchasePrice;
      }

      if (Object.keys(patch).length > 0) {
        updates.push({ itemId: item.purchaseOrderItemId, patch });
      }
    } else {
      additions.push({
        medicineId: item.medicineId,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
      });
    }
  }

  return { removals, updates, additions };
}
