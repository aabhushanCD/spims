import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useBatchHistory } from "../hooks/useQueryBatch";
import type { Batch } from "../types/batch.types";

interface Props {
  batch: Batch;
  onOpenChange: (open: boolean) => void;
}

export default function BatchHistoryDialog({ batch, onOpenChange }: Props) {
  const history = useBatchHistory(batch._id);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Batch {batch.batchNumber}</DialogTitle>
          <DialogDescription>
            {batch.medicineId?.medicineName ?? "Medicine"} · expiry{" "}
            {new Date(batch.expiryDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Received</p>
            <p className="font-medium">{batch.quantityReceived}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-medium">{batch.quantityRemaining}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Selling price</p>
            <p className="font-medium">{formatCurrency(batch.sellingPrice)}</p>
          </div>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center">
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  </TableCell>
                </TableRow>
              )}

              {!history.isLoading && (history.data?.movements.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-20 text-center">
                    No movements recorded.
                  </TableCell>
                </TableRow>
              )}

              {history.data?.movements.map((movement) => (
                <TableRow key={movement._id}>
                  <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                  <TableCell>{movement.movementType}</TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell className="text-xs">
                    {movement.referenceType}
                  </TableCell>
                  <TableCell>{movement.performedBy?.name ?? "-"}</TableCell>
                  <TableCell>{movement.remarks || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
