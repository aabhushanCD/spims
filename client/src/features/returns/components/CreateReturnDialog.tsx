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
import { useAuth } from "@/features/auth/context/authContext";
import type { SaleDetails } from "@/features/sales/types/sale.types";
import { useCreateReturn } from "../hooks/useReturns";
import type { ReturnCondition } from "../types/return.types";

interface Props {
  sale: SaleDetails;
  onOpenChange: (open: boolean) => void;
}

interface DraftLine {
  selected: boolean;
  saleItemId: string;
  medicineName: string;
  batchNumber?: string;
  maxQuantity: number;
  quantity: number;
  condition: ReturnCondition;
  restockingFee: number;
  remarks: string;
}

const conditions: ReturnCondition[] = ["GOOD", "DAMAGED", "EXPIRED", "OPENED"];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateReturnDialog({ sale, onOpenChange }: Props) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const createReturn = useCreateReturn();

  const [returnReason, setReturnReason] = useState("");
  const [returnDate, setReturnDate] = useState(today());
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>(() =>
    sale.items
      .filter((item) => item.quantity - item.returnedQuantity > 0)
      .map((item) => ({
        selected: false,
        saleItemId: item.id ?? "",
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        maxQuantity: item.quantity - item.returnedQuantity,
        quantity: 1,
        condition: "GOOD",
        restockingFee: 0,
        remarks: "",
      })),
  );

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function handleSubmit() {
    if (!currentUser) {
      setError("You must be signed in to create a return");
      return;
    }
    if (returnReason.trim().length < 3) {
      setError("Enter a return reason of at least 3 characters");
      return;
    }

    const selected = lines.filter((line) => line.selected);
    if (selected.length === 0) {
      setError("Select at least one item to return");
      return;
    }

    for (const line of selected) {
      if (
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > line.maxQuantity
      ) {
        setError(
          `Quantity for ${line.medicineName} must be between 1 and ${line.maxQuantity}`,
        );
        return;
      }
      if (line.restockingFee < 0) {
        setError("Restocking fee cannot be negative");
        return;
      }
    }

    setError(null);
    createReturn.mutate(
      {
        salesId: sale.id,
        returnReason: returnReason.trim(),
        returnedBy: currentUser._id,
        returnDate: new Date(returnDate).toISOString(),
        items: selected.map((line) => ({
          saleItemId: line.saleItemId,
          quantity: line.quantity,
          condition: line.condition,
          ...(line.restockingFee > 0
            ? { restockingFee: line.restockingFee }
            : {}),
          ...(line.remarks.trim() ? { remarks: line.remarks.trim() } : {}),
        })),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          navigate(`/returns/${created._id}`);
        },
      },
    );
  }

  const hasReturnableItems = lines.length > 0;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create return</DialogTitle>
          <DialogDescription>
            Invoice {sale.invoiceNo}. Stock and refunds are applied only after
            the return is approved and completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="return-reason">Reason</Label>
              <Textarea
                id="return-reason"
                rows={2}
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                placeholder="Why is the customer returning these items?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="return-date">Return date</Label>
              <Input
                id="return-date"
                type="date"
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
              />
            </div>
          </div>

          {!hasReturnableItems ? (
            <p className="text-muted-foreground rounded-lg border p-4 text-sm">
              This sale has no remaining items that can be returned.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Return</th>
                    <th className="p-3">Medicine</th>
                    <th className="p-3">Max</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Condition</th>
                    <th className="p-3">Fee</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={`${line.saleItemId}-${index}`} className="border-t">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={line.selected}
                          onChange={(event) =>
                            updateLine(index, {
                              selected: event.target.checked,
                            })
                          }
                          aria-label={`Return ${line.medicineName}`}
                        />
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{line.medicineName}</div>
                        <div className="text-muted-foreground text-xs">
                          {line.batchNumber ?? "No batch"}
                        </div>
                      </td>
                      <td className="p-3">{line.maxQuantity}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={1}
                          max={line.maxQuantity}
                          className="h-8 w-20"
                          value={line.quantity}
                          onChange={(event) =>
                            updateLine(index, {
                              quantity: Number(event.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={line.condition}
                          onValueChange={(value) =>
                            updateLine(index, {
                              condition: value as ReturnCondition,
                              ...(value !== "GOOD"
                                ? { restockingFee: 0 }
                                : {}),
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          className="h-8 w-24"
                          value={line.restockingFee}
                          disabled={line.condition !== "GOOD"}
                          onChange={(event) =>
                            updateLine(index, {
                              restockingFee: Number(event.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Input
                          className="h-8 w-40"
                          value={line.remarks}
                          onChange={(event) =>
                            updateLine(index, { remarks: event.target.value })
                          }
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <Button
            onClick={handleSubmit}
            disabled={createReturn.isPending || !hasReturnableItems}
          >
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
