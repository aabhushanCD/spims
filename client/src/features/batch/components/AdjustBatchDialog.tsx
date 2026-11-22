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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adjustBatchSchema } from "../schema/adjustBatch.schema";
import type { Batch } from "../types/batch.types";
import { useAdjustStock } from "../hooks/useMutateBatch";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch;
}

export default function AdjustBatchDialog({
  open,
  onOpenChange,
  batch,
}: Props) {
  const adjustStock = useAdjustStock();
  const [quantity, setQuantity] = useState(String(batch.quantityRemaining));
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    const parsed = adjustBatchSchema.safeParse({ quantity, remarks });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid adjustment");
      return;
    }

    if (parsed.data.quantity > batch.quantityReceived) {
      setError(
        `Quantity cannot exceed the received quantity (${batch.quantityReceived})`,
      );
      return;
    }

    setError(null);
    adjustStock.mutate(
      {
        id: batch._id,
        data: {
          quantity: parsed.data.quantity,
          remarks: parsed.data.remarks,
        },
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust batch stock</DialogTitle>
          <DialogDescription>
            Set the absolute remaining quantity for batch{" "}
            <span className="font-medium">{batch?.batchNumber}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adjust-quantity">Remaining quantity</Label>
            <Input
              id="adjust-quantity"
              type="number"
              min={0}
              max={batch?.quantityReceived}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Received: {batch?.quantityReceived ?? 0}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjust-remarks">Remarks</Label>
            <Textarea
              id="adjust-remarks"
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Reason for the adjustment"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adjustStock.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={adjustStock.isPending}>
            {adjustStock.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
