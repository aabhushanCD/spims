import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBatches } from "@/features/batch/hooks/useQueryBatch";
import { formatCurrency, formatDateTime } from "@/lib/format";
import PurchaseReturnStatusBadge from "../components/PurchaseReturnStatusBadge";
import SupplierLedgerDialog from "../components/SupplierLedgerDialog";
import {
  usePurchaseReturn,
  usePurchaseReturnAction,
} from "../hooks/usePurchaseReturns";
import {
  entityId,
  entityLabel,
  type PurchaseReturnOrderRef,
  type PurchaseReturnSupplierRef,
} from "../types/purchaseReturn.types";

type Action = "approve" | "reject" | "cancel" | "complete";

export default function PurchaseReturnDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const purchaseReturn = usePurchaseReturn(id);
  const action = usePurchaseReturnAction(id ?? "");
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const orderId = purchaseReturn.data
    ? entityId(purchaseReturn.data.purchaseOrderId)
    : "";
  const batches = useBatches(
    orderId ? { purchaseOrderId: orderId } : {},
    Boolean(orderId),
  );

  const batchInfo = useMemo(() => {
    const map = new Map<string, { batchNumber: string; medicine: string }>();
    for (const batch of batches.data?.items ?? []) {
      map.set(batch._id, {
        batchNumber: batch.batchNumber,
        medicine: batch.medicineId?.medicineName ?? "-",
      });
    }
    return map;
  }, [batches.data?.items]);

  if (purchaseReturn.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-24 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading purchase return...
      </div>
    );
  }

  const data = purchaseReturn.data;
  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-muted-foreground">Purchase return not found.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/purchase-returns")}
        >
          Back to Purchase Returns
        </Button>
      </div>
    );
  }

  const supplier = data.supplierId as
    | string
    | PurchaseReturnSupplierRef;
  const order = data.purchaseOrderId as
    | string
    | PurchaseReturnOrderRef;
  const supplierId = entityId(supplier);

  const runAction = (next: Action) => {
    action.mutate(next, { onSuccess: () => setConfirmAction(null) });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost">
          <Link to="/purchase-returns">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Purchase Returns
          </Link>
        </Button>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setLedgerOpen(true)}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            Supplier ledger
          </Button>

          {data.status === "PENDING" && (
            <>
              <Button
                disabled={action.isPending}
                onClick={() => runAction("approve")}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={action.isPending}
                onClick={() => setConfirmAction("reject")}
              >
                Reject
              </Button>
              <Button
                variant="outline"
                disabled={action.isPending}
                onClick={() => setConfirmAction("cancel")}
              >
                Cancel
              </Button>
            </>
          )}

          {data.status === "APPROVED" && (
            <Button
              disabled={action.isPending}
              onClick={() => setConfirmAction("complete")}
            >
              Complete return
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Return {data.returnNumber}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">
                {formatDateTime(data.returnDate)}
              </p>
            </div>
            <PurchaseReturnStatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Supplier</p>
              <p className="font-medium">{entityLabel(supplier)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Purchase order</p>
              <p className="font-medium">{entityLabel(order)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Refund</p>
              <p className="font-medium">
                {formatCurrency(data.refundAmount)}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-muted-foreground">Reason</p>
              <p>{data.returnReason}</p>
            </div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Refund</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item, index) => {
                const info = batchInfo.get(item.batchId);
                return (
                  <TableRow key={item._id ?? `${item.batchId}-${index}`}>
                    <TableCell className="font-medium">
                      {info?.medicine ?? "Batch item"}
                    </TableCell>
                    <TableCell>{info?.batchNumber ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unitCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.refundAmount)}
                    </TableCell>
                    <TableCell>{item.remarks || "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {ledgerOpen && (
        <SupplierLedgerDialog
          supplierId={supplierId}
          companyName={entityLabel(supplier)}
          onOpenChange={setLedgerOpen}
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
                ? "Complete this purchase return?"
                : confirmAction === "reject"
                  ? "Reject this purchase return?"
                  : "Cancel this purchase return?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "complete"
                ? "Completing deducts batch stock and records a supplier credit."
                : "This changes the return status. It cannot be undone through the UI."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={action.isPending}>
              Keep return
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={action.isPending}
              onClick={() => confirmAction && runAction(confirmAction)}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
