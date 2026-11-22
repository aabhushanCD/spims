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
import type { Batch } from "../types/batch.types";
import { useDeductQuantity, useIncreaseQuantity } from "../hooks/useMutateBatch";

interface Props {
  mode: "increase" | "deduct";
  batch: Batch;
  onOpenChange: (open: boolean) => void;
}

export default function BatchQuantityDialog({
  mode,
  batch,
  onOpenChange,
}: Props) {
  const increase = useIncreaseQuantity();
  const deduct = useDeductQuantity();
  const mutation = mode === "increase" ? increase : deduct;
  const [quantity, setQuantity] = useState("1");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const value = Number(quantity);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter a positive whole number");
      return;
    }
    if (mode === "deduct" && value > batch.quantityRemaining) {
      setError(`Cannot deduct more than ${batch.quantityRemaining}`);
      return;
    }

    setError(null);
    mutation.mutate(
      {
        id: batch._id,
        data: {
          quantity: value,
          ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "increase" ? "Increase batch stock" : "Deduct batch stock"}
          </DialogTitle>
          <DialogDescription>
            {batch.batchNumber} currently has {batch.quantityRemaining} units.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="batch-quantity">Quantity</Label>
            <Input
              id="batch-quantity"
              type="number"
              min={1}
              max={mode === "deduct" ? batch.quantityRemaining : undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch-quantity-remarks">Remarks</Label>
            <Textarea
              id="batch-quantity-remarks"
              rows={3}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === "increase" ? "Increase" : "Deduct"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
