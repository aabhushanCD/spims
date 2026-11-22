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
import { useUpdateStocktake } from "../hooks/useStocktakes";
import type { Stocktake } from "../types/stocktake.types";

interface Props {
  stocktake: Stocktake;
  onOpenChange: (open: boolean) => void;
}

interface Line {
  batchId: string;
  countedQuantity: number;
  remarks: string;
}

export default function StocktakeEditDialog({
  stocktake,
  onOpenChange,
}: Props) {
  const update = useUpdateStocktake(stocktake._id);
  const [notes, setNotes] = useState(stocktake.notes ?? "");
  const [lines, setLines] = useState<Line[]>(() =>
    stocktake.items.map((item) => ({
      batchId: item.batchId,
      countedQuantity: item.countedQuantity,
      remarks: item.remarks ?? "",
    })),
  );
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  }

  function handleSubmit() {
    for (const line of lines) {
      if (!Number.isInteger(line.countedQuantity) || line.countedQuantity < 0) {
        setError("Counted quantities must be zero or more");
        return;
      }
    }

    setError(null);
    update.mutate(
      {
        notes: notes.trim() || undefined,
        items: lines.map((line) => ({
          batchId: line.batchId,
          countedQuantity: line.countedQuantity,
          ...(line.remarks.trim() ? { remarks: line.remarks.trim() } : {}),
        })),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update counts</DialogTitle>
          <DialogDescription>
            {stocktake.stocktakeNumber}. Completed and cancelled stocktakes are
            read-only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stocktake-edit-notes">Notes</Label>
            <Textarea
              id="stocktake-edit-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            {lines.map((line, index) => (
              <div
                key={line.batchId}
                className="grid items-center gap-2 rounded-lg border p-3 sm:grid-cols-3"
              >
                <span className="text-muted-foreground text-xs">
                  Batch {line.batchId.slice(-6)}
                </span>
                <Input
                  type="number"
                  min={0}
                  value={line.countedQuantity}
                  onChange={(event) =>
                    updateLine(index, {
                      countedQuantity: Number(event.target.value),
                    })
                  }
                />
                <Input
                  value={line.remarks}
                  onChange={(event) =>
                    updateLine(index, { remarks: event.target.value })
                  }
                  placeholder="Remarks"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={update.isPending}>
            {update.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save counts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
