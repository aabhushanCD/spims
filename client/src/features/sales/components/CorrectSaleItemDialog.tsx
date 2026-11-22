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
import type { SaleDetailsItem } from "../types/sale.types";
import { useCorrectSaleItem } from "../hooks/useCorrectSaleItem";

interface Props {
  saleId: string;
  item: SaleDetailsItem;
  onOpenChange: (open: boolean) => void;
}

export default function CorrectSaleItemDialog({
  saleId,
  item,
  onOpenChange,
}: Props) {
  const correctItem = useCorrectSaleItem();
  const [unitPrice, setUnitPrice] = useState(String(item.unitPrice));
  const [discount, setDiscount] = useState(
    String(
      Math.round(
        item.unitPrice * item.quantity * (item.discountPercentage / 100) * 100,
      ) / 100,
    ),
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const price = Number(unitPrice);
    const discountValue = Number(discount);

    if (!Number.isFinite(price) || price <= 0) {
      setError("Unit price must be greater than zero");
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      setError("Discount cannot be negative");
      return;
    }
    if (discountValue > price * item.quantity) {
      setError("Discount cannot exceed the line total");
      return;
    }

    setError(null);
    correctItem.mutate(
      {
        itemId: item.id ?? "",
        saleId,
        data: {
          unitPrice: price,
          discount: discountValue,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct sale line</DialogTitle>
          <DialogDescription>
            {item.medicineName} × {item.quantity}. The parent invoice totals
            are recalculated by the server.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="correction-price">Unit price</Label>
            <Input
              id="correction-price"
              type="number"
              min={0.01}
              step="0.01"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="correction-discount">Line discount (amount)</Label>
            <Input
              id="correction-discount"
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={correctItem.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={correctItem.isPending}>
            {correctItem.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
