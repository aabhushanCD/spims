import { useState } from "react";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Batch } from "../types/batch.types";
import { useConfirmDisposal } from "../hooks/useMutateBatch";

interface Props {
  batch: Batch;
  onOpenChange: (open: boolean) => void;
}

export default function BatchDisposalDialog({ batch, onOpenChange }: Props) {
  const dispose = useConfirmDisposal();
  const [remarks, setRemarks] = useState("");

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dispose expired stock?</AlertDialogTitle>
          <AlertDialogDescription>
            This deducts all {batch.quantityRemaining} remaining units from{" "}
            {batch.batchNumber} and writes an expiry movement.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          rows={3}
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Disposal remarks (optional)"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={dispose.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={dispose.isPending}
            onClick={() => {
              dispose.mutate(
                {
                  id: batch._id,
                  ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
                },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {dispose.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Dispose stock
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
