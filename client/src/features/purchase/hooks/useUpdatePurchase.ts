import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { purchaseService } from "../services/purchase.service";
import { buildPurchaseItemChanges } from "../lib/purchaseItemDiff";
import type { PurchaseForm } from "../schema/purchase.schema";
import type { PurchaseDetailsItem } from "../types/PurchaseDetails";

interface UpdatePurchaseItemsInput {
  id: string;
  items: PurchaseForm["items"];
  originalItems: PurchaseDetailsItem[];
}

/**
 * Applies an item-level diff to a pending purchase order.
 *
 * The API has no purchase-order header editor, so editing is limited to
 * quantity/price changes, added items, and removed items. Totals are
 * recalculated after the diff is applied.
 */
export const useUpdatePurchaseItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      items,
      originalItems,
    }: UpdatePurchaseItemsInput) => {
      const { removals, updates, additions } = buildPurchaseItemChanges(
        items,
        originalItems,
      );

      // Remove first so a deleted item can be replaced by a new row for the
      // same medicine without tripping the duplicate-medicine check.
      for (const itemId of removals) {
        await purchaseService.removePurchaseOrderItem(id, itemId);
      }

      for (const update of updates) {
        await purchaseService.updatePurchaseOrderItem(
          id,
          update.itemId,
          update.patch,
        );
      }

      for (const addition of additions) {
        await purchaseService.addPurchaseOrderItem(id, addition);
      }

      await purchaseService.recalculatePurchaseOrder(id);
    },

    onSuccess: (_result, variables) => {
      toast.success("Purchase order updated successfully");
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({
        queryKey: ["purchase-order", variables.id],
      });
    },

    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update purchase order"));
    },
  });
};
