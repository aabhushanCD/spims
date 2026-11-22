export interface ReceiptRowLike {
  purchaseOrderItemId: string;
  quantityReceived: number;
}

export function sumReceiptQuantities(
  rows: ReceiptRowLike[],
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const row of rows) {
    totals.set(
      row.purchaseOrderItemId,
      (totals.get(row.purchaseOrderItemId) ?? 0) + row.quantityReceived,
    );
  }

  return totals;
}

/**
 * Returns the first over-receipt error, or null when every item's receipt
 * rows fit within its remaining quantity.
 */
export function validateReceiptTotals(
  rows: ReceiptRowLike[],
  remainingById: Map<string, number>,
  itemLabelById: Map<string, string> = new Map(),
): string | null {
  for (const [itemId, total] of sumReceiptQuantities(rows)) {
    const remaining = remainingById.get(itemId);

    if (remaining === undefined) {
      return "Receipt line does not match a purchase order item";
    }
    if (total > remaining) {
      const label = itemLabelById.get(itemId) ?? "this item";
      return `Received quantity exceeds the remaining ${remaining} for ${label}`;
    }
  }

  return null;
}
