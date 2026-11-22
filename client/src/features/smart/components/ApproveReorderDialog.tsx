import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReorderRecommendation } from "../types/smart.types";
import { useApproveRecommendation } from "../hooks/useSmartMutate";

interface Props {
  recommendation: ReorderRecommendation;
  onOpenChange: (open: boolean) => void;
}

export default function ApproveReorderDialog({
  recommendation,
  onOpenChange,
}: Props) {
  const approve = useApproveRecommendation();
  const [createPurchaseOrder, setCreatePurchaseOrder] = useState(false);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve recommendation</DialogTitle>
          <DialogDescription>
            {recommendation.medicineId.medicineName} · order{" "}
            {recommendation.suggestedQuantity} units.
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
          <input
            type="checkbox"
            checked={createPurchaseOrder}
            onChange={(event) =>
              setCreatePurchaseOrder(event.target.checked)
            }
            className="mt-1"
          />
          <span>
            Create a draft purchase order
            <span className="text-muted-foreground mt-1 block text-xs">
              Requires `SMART_REORDER_AUTO_PO=true` and an active supplier with
              a known purchase price. Otherwise the server returns an error.
            </span>
          </span>
        </label>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={approve.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={approve.isPending}
            onClick={() =>
              approve.mutate(
                { id: recommendation._id, createPurchaseOrder },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {approve.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
