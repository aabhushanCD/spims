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
import type { InventoryItem } from "../types/inventory.types";
import { useReleaseStock, useReserveStock } from "../hooks/useMovements";

interface Props {
  mode: "reserve" | "release";
  item: InventoryItem;
  onOpenChange: (open: boolean) => void;
}

export default function ReserveStockDialog({
  mode,
  item,
  onOpenChange,
}: Props) {
  const reserve = useReserveStock();
  const release = useReleaseStock();
  const mutation = mode === "reserve" ? reserve : release;
  const [quantity, setQuantity] = useState("1");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const max =
    mode === "reserve" ? item.availableStock : item.reservedStock;

  function handleSubmit() {
    const value = Number(quantity);

    if (!Number.isInteger(value) || value <= 0) {
      setError("Enter a positive whole number");
      return;
    }
    if (value > max) {
      setError(`Quantity cannot exceed ${max}`);
      return;
    }

    setError(null);
    mutation.mutate(
      {
        medicineId: item.medicineId._id,
        data: {
          quantity: value,
          referenceId: item._id,
          referenceType: mode === "reserve" ? "RESERVE" : "RELEASE",
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
            {mode === "reserve" ? "Reserve stock" : "Release reserved stock"}
          </DialogTitle>
          <DialogDescription>
            {item.medicineId.medicineName} · available{" "}
            {item.availableStock}, reserved {item.reservedStock}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reserve-quantity">Quantity</Label>
            <Input
              id="reserve-quantity"
              type="number"
              min={1}
              max={max}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reserve-remarks">Remarks</Label>
            <Textarea
              id="reserve-remarks"
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
            {mode === "reserve" ? "Reserve" : "Release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
