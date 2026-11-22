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
import { Textarea } from "@/components/ui/textarea";
import { useBatches } from "@/features/batch/hooks/useQueryBatch";
import type { Batch } from "@/features/batch/types/batch.types";
import { useCreateStocktake } from "../hooks/useStocktakes";

interface Props {
  onOpenChange: (open: boolean) => void;
}

interface DraftLine {
  batch: Batch;
  selected: boolean;
  countedQuantity: number;
  remarks: string;
}

export default function CreateStocktakeDialog({ onOpenChange }: Props) {
  const navigate = useNavigate();
  const batches = useBatches();
  const createStocktake = useCreateStocktake();
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [lines, setLines] = useState<DraftLine[]>([]);

  // Initialize from the fetched batch page; keeping this derived avoids an
  // effect that writes state during render.
  const draftLines: DraftLine[] =
    lines.length > 0
      ? lines
      : (batches.data?.items ?? []).map((batch) => ({
          batch,
          selected: false,
          countedQuantity: batch.quantityRemaining,
          remarks: "",
        }));

  const filtered = draftLines.filter((line) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      line.batch.batchNumber.toLowerCase().includes(query) ||
      (line.batch.medicineId?.medicineName ?? "").toLowerCase().includes(query)
    );
  });

  function updateLine(batchId: string, patch: Partial<DraftLine>) {
    const base = draftLines.map((line) =>
      line.batch._id === batchId ? { ...line, ...patch } : line,
    );
    setLines(base);
  }

  function handleSubmit() {
    const selected = draftLines.filter((line) => line.selected);

    if (selected.length === 0) {
      setError("Select at least one batch to count");
      return;
    }

    for (const line of selected) {
      if (
        !Number.isInteger(line.countedQuantity) ||
        line.countedQuantity < 0
      ) {
        setError(
          `Counted quantity for ${line.batch.batchNumber} must be zero or more`,
        );
        return;
      }
    }

    setError(null);
    createStocktake.mutate(
      {
        notes: notes.trim() || undefined,
        items: selected.map((line) => ({
          batchId: line.batch._id,
          countedQuantity: line.countedQuantity,
          ...(line.remarks.trim() ? { remarks: line.remarks.trim() } : {}),
        })),
      },
      {
        onSuccess: (created) => {
          onOpenChange(false);
          navigate(`/stocktakes/${created._id}`);
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Start stocktake</DialogTitle>
          <DialogDescription>
            Select batches and enter the physically counted quantity. System
            quantities are captured now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="stocktake-notes">Notes</Label>
            <Textarea
              id="stocktake-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes for this count"
            />
          </div>

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter batches by number or medicine..."
          />

          {batches.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading batches...</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-2">Count</th>
                    <th className="p-2">Medicine</th>
                    <th className="p-2">Batch</th>
                    <th className="p-2">System</th>
                    <th className="p-2">Counted</th>
                    <th className="p-2">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((line) => (
                    <tr key={line.batch._id} className="border-t">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={line.selected}
                          onChange={(event) =>
                            updateLine(line.batch._id, {
                              selected: event.target.checked,
                            })
                          }
                          aria-label={`Count ${line.batch.batchNumber}`}
                        />
                      </td>
                      <td className="p-2">
                        {line.batch.medicineId?.medicineName ?? "-"}
                      </td>
                      <td className="p-2">{line.batch.batchNumber}</td>
                      <td className="p-2">{line.batch.quantityRemaining}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={0}
                          className="h-8 w-24"
                          value={line.countedQuantity}
                          onChange={(event) =>
                            updateLine(line.batch._id, {
                              countedQuantity: Number(event.target.value),
                            })
                          }
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          className="h-8 w-40"
                          value={line.remarks}
                          onChange={(event) =>
                            updateLine(line.batch._id, {
                              remarks: event.target.value,
                            })
                          }
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
            disabled={createStocktake.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createStocktake.isPending || batches.isLoading}
          >
            {createStocktake.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Start count
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
