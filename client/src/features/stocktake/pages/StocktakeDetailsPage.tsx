import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBatches } from "@/features/batch/hooks/useQueryBatch";
import { formatDateTime } from "@/lib/format";
import StocktakeEditDialog from "../components/StocktakeEditDialog";
import { summarizeStocktake } from "../lib/stocktakeMath";
import {
  useCancelStocktake,
  useCompleteStocktake,
  useStocktake,
} from "../hooks/useStocktakes";

type ConfirmAction = "complete" | "cancel";

export default function StocktakeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const stocktake = useStocktake(id);
  const batches = useBatches();
  const complete = useCompleteStocktake(id ?? "");
  const cancel = useCancelStocktake(id ?? "");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  const batchNames = useMemo(() => {
    const map = new Map<string, { batchNumber: string; medicine: string }>();
    for (const batch of batches.data?.items ?? []) {
      map.set(batch._id, {
        batchNumber: batch.batchNumber,
        medicine: batch.medicineId?.medicineName ?? "-",
      });
    }
    return map;
  }, [batches.data?.items]);

  if (stocktake.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-24 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading stocktake...
      </div>
    );
  }

  const data = stocktake.data;

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-muted-foreground">Stocktake not found.</p>
        <Button variant="outline" onClick={() => navigate("/stocktakes")}>
          Back to Stocktakes
        </Button>
      </div>
    );
  }

  const isOpen = data.status === "IN_PROGRESS" || data.status === "DRAFT";
  const isPending = complete.isPending || cancel.isPending;
  const summary = summarizeStocktake(data.items);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/stocktakes">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Stocktakes
          </Link>
        </Button>

        {isOpen && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              Update counts
            </Button>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => setConfirmAction("cancel")}
            >
              Cancel stocktake
            </Button>
            <Button
              disabled={isPending}
              onClick={() => setConfirmAction("complete")}
            >
              Complete stocktake
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{data.stocktakeNumber}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                Started {formatDateTime(data.createdAt)}
              </p>
            </div>
            <Badge
              variant={
                data.status === "COMPLETED"
                  ? "default"
                  : data.status === "CANCELLED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {data.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.notes && (
            <p className="text-muted-foreground text-sm">{data.notes}</p>
          )}

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{summary.lineCount} lines</Badge>
            <Badge variant="secondary">
              {summary.varianceCount} with variance
            </Badge>
            <Badge variant={summary.netVariance === 0 ? "outline" : "destructive"}>
              Net {summary.netVariance > 0 ? "+" : ""}
              {summary.netVariance}
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">System</TableHead>
                <TableHead className="text-right">Counted</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, index) => {
                const batch = batchNames.get(item.batchId);
                return (
                  <TableRow key={item._id ?? `${item.batchId}-${index}`}>
                    <TableCell className="font-medium">
                      {batch?.medicine ?? `Batch ${item.batchId.slice(-6)}`}
                    </TableCell>
                    <TableCell>{batch?.batchNumber ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {item.systemQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.countedQuantity}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          item.variance === 0
                            ? ""
                            : "text-destructive font-medium"
                        }
                      >
                        {item.variance > 0 ? `+${item.variance}` : item.variance}
                      </span>
                    </TableCell>
                    <TableCell>{item.remarks || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editOpen && (
        <StocktakeEditDialog
          key={data._id}
          stocktake={data}
          onOpenChange={setEditOpen}
        />
      )}

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "complete"
                ? "Complete this stocktake?"
                : "Cancel this stocktake?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "complete"
                ? "Counted quantities will be applied to stock and adjustment movements will be written."
                : "The count will be closed without changing stock."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Keep open
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (confirmAction === "complete") {
                  complete.mutate(undefined, {
                    onSuccess: () => setConfirmAction(null),
                  });
                } else {
                  cancel.mutate(undefined, {
                    onSuccess: () => setConfirmAction(null),
                  });
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
