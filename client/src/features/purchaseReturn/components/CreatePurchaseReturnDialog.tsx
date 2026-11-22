import { useState } from "react";
import { useNavigate } from "react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBatches } from "@/features/batch/hooks/useQueryBatch";
import { usePurchases } from "@/features/purchase/hooks/usePurchases";
import { useCreatePurchaseReturn } from "../hooks/usePurchaseReturns";

interface Props {
  onOpenChange: (open: boolean) => void;
}

interface LineState {
  selected: boolean;
  quantity: number;
  remarks: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreatePurchaseReturnDialog({
  onOpenChange,
}: Props) {
  const navigate = useNavigate();
  const purchases = usePurchases();
  const createReturn = useCreatePurchaseReturn();
  const [purchaseOrderId, setPurchaseOrderId] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnDate, setReturnDate] = useState(today());
  const [lines, setLines] = useState<Record<string, LineState>>({});
  const [error, setError] = useState<string | null>(null);

  const receivedOrders =
    purchases.data?.filter((purchase) => purchase.status === "received") ?? [];

  const batches = useBatches(
    purchaseOrderId ? { purchaseOrderId } : {},
    Boolean(purchaseOrderId),
  );

  const returnableBatches =
    batches.data?.items.filter((batch) => batch.quantityRemaining > 0) ?? [];

  function lineFor(batchId: string, maxQuantity: number): LineState {
    return (
      lines[batchId] ?? {
        selected: false,
        quantity: maxQuantity,
        remarks: "",
      }
    );
  }

  function updateLine(batchId: string, maxQuantity: number, patch: Partial<LineState>) {
    setLines((current) => ({
      ...current,
      [batchId]: { ...lineFor(batchId, maxQuantity), ...patch },
    }));
  }

  function handleSubmit() {
    if (!purchaseOrderId) {
      setError("Select a received purchase order");
      return;
    }
    if (returnReason.trim().length < 3) {
      setError("Enter a return reason of at least 3 characters");
      return;
    }

    const selected = returnableBatches.filter(
      (batch) => lineFor(batch._id, batch.quantityRemaining).selected,
    );

    if (selected.length === 0) {
      setError("Select at least one batch to return");
      return;
    }

    for (const batch of selected) {
      const line = lineFor(batch._id, batch.quantityRemaining);
      if (
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > batch.quantityRemaining
      ) {
        setError(
          `Quantity for ${batch.batchNumber} must be between 1 and ${batch.quantityRemaining}`,
        );
        return;
      }
    }

    setError(null);
    createReturn.mutate(
      {
        purchaseOrderId,
        returnReason: returnReason.trim(),
        returnDate: new Date(returnDate).toISOString(),
        items: selected.map((batch) => {
          const line = lineFor(batch._id, batch.quantityRemaining);
          return {
            batchId: batch._id,
            quantity: line.quantity,
            ...(line.remarks.trim() ? { remarks: line.remarks.trim() } : {}),
          };
        }),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          navigate(`/purchase-returns/${created._id}`);
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create purchase return</DialogTitle>
          <DialogDescription>
            Only received purchase orders can be returned to the supplier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Purchase order</Label>
              <Select
                value={purchaseOrderId}
                onValueChange={(value) => {
                  setPurchaseOrderId(value);
                  setLines({});
                  setError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select received order" />
                </SelectTrigger>
                <SelectContent>
                  {receivedOrders.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No received purchase orders
                    </SelectItem>
                  ) : (
                    receivedOrders.map((purchase) => (
                      <SelectItem key={purchase._id} value={purchase._id}>
                        {purchase.invoiceNumber} —{" "}
                        {purchase.supplierId.companyName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purchase-return-date">Return date</Label>
              <Input
                id="purchase-return-date"
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purchase-return-reason">Reason</Label>
            <Textarea
              id="purchase-return-reason"
              rows={2}
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              placeholder="Why are these batches being returned?"
            />
          </div>

          {purchaseOrderId && (
            <div className="overflow-x-auto rounded-lg border">
              {batches.isLoading ? (
                <p className="text-muted-foreground p-4 text-sm">
                  Loading batches...
                </p>
              ) : returnableBatches.length === 0 ? (
                <p className="text-muted-foreground p-4 text-sm">
                  This order has no batches with remaining stock.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-3">Return</th>
                      <th className="p-3">Medicine</th>
                      <th className="p-3">Batch</th>
                      <th className="p-3">Remaining</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnableBatches.map((batch) => {
                      const line = lineFor(batch._id, batch.quantityRemaining);
                      return (
                        <tr key={batch._id} className="border-t">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={line.selected}
                              onChange={(event) =>
                                updateLine(batch._id, batch.quantityRemaining, {
                                  selected: event.target.checked,
                                })
                              }
                              aria-label={`Return ${batch.batchNumber}`}
                            />
                          </td>
                          <td className="p-3">
                            {batch.medicineId?.medicineName ?? "-"}
                          </td>
                          <td className="p-3">{batch.batchNumber}</td>
                          <td className="p-3">{batch.quantityRemaining}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={1}
                              max={batch.quantityRemaining}
                              className="h-8 w-24"
                              value={line.quantity}
                              onChange={(event) =>
                                updateLine(
                                  batch._id,
                                  batch.quantityRemaining,
                                  { quantity: Number(event.target.value) },
                                )
                              }
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              className="h-8 w-40"
                              value={line.remarks}
                              onChange={(event) =>
                                updateLine(
                                  batch._id,
                                  batch.quantityRemaining,
                                  { remarks: event.target.value },
                                )
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReturn.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createReturn.isPending}>
            {createReturn.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
