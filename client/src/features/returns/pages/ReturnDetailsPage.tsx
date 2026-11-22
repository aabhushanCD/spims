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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/context/authContext";
import { useSale } from "@/features/sales/hooks/useSale";
import { formatCurrency, formatDateTime } from "@/lib/format";
import ReturnStatusBadge from "../components/ReturnStatusBadge";
import { useReturn, useReturnTransition } from "../hooks/useReturns";
import type { TransitionAction } from "../hooks/useReturns";

export default function ReturnDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const salesReturn = useReturn(id);
  const sale = useSale(salesReturn.data?.salesId);
  const transition = useReturnTransition(id ?? "");
  const [confirmAction, setConfirmAction] = useState<TransitionAction | null>(
    null,
  );

  const saleItemsById = useMemo(() => {
    const map = new Map<string, { name: string; batch?: string }>();
    for (const item of sale.data?.items ?? []) {
      if (item.id) {
        map.set(item.id, {
          name: item.medicineName,
          batch: item.batchNumber,
        });
      }
    }
    return map;
  }, [sale.data?.items]);

  if (salesReturn.isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-24 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading return...
      </div>
    );
  }

  const data = salesReturn.data;

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-muted-foreground">Return not found.</p>
        <Button variant="outline" onClick={() => navigate("/returns")}>
          Back to Returns
        </Button>
      </div>
    );
  }

  const canApprove =
    currentUser?.role === "owner" ||
    currentUser?.role === "inventory_manager";

  const runAction = (action: TransitionAction) => {
    transition.mutate(
      { action },
      {
        onSuccess: () => setConfirmAction(null),
      },
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate("/returns")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Returns
        </Button>

        <div className="flex flex-wrap gap-2">
          {data.status === "PENDING" && canApprove && (
            <>
              <Button
                variant="outline"
                disabled={transition.isPending}
                onClick={() => runAction("approve")}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                disabled={transition.isPending}
                onClick={() => setConfirmAction("reject")}
              >
                Reject
              </Button>
            </>
          )}
          {data.status === "PENDING" && (
            <Button
              variant="outline"
              disabled={transition.isPending}
              onClick={() => setConfirmAction("cancel")}
            >
              Cancel return
            </Button>
          )}
          {data.status === "APPROVED" && (
            <Button
              disabled={transition.isPending}
              onClick={() => runAction("complete")}
            >
              Complete return
            </Button>
          )}
          {data.status === "COMPLETED" && canApprove && (
            <Button
              variant="destructive"
              disabled={transition.isPending}
              onClick={() => setConfirmAction("reverse")}
            >
              Reverse return
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
            <ReturnStatusBadge status={data.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Sale</p>
              <Link
                to={`/sales/${data.salesId}`}
                className="text-primary font-medium hover:underline"
              >
                #{String(data.salesId).slice(-6)}
              </Link>
            </div>
            <div>
              <p className="text-muted-foreground">Refund</p>
              <p className="font-medium">{formatCurrency(data.refundAmount)}</p>
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
                <TableHead>Item</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.returnItems.map((line, index) => {
                const item = saleItemsById.get(String(line.saleItemId));
                return (
                  <TableRow key={line._id ?? `${line.saleItemId}-${index}`}>
                    <TableCell className="font-medium">
                      {item?.name ?? `Item ${String(line.saleItemId).slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      {item?.batch ??
                        (line.batchId
                          ? String(line.batchId).slice(-6)
                          : "-")}
                    </TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{line.condition}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.restockingFee)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.refundAmount)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={Boolean(confirmAction)}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "reject"
                ? "Reject this return?"
                : confirmAction === "cancel"
                  ? "Cancel this return?"
                  : "Reverse this completed return?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "reverse"
                ? "Reversing deducts GOOD stock again, restores returned quantities, and reverses the refund."
                : "This changes the return status and cannot be undone through the UI."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transition.isPending}>
              Keep return
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={transition.isPending}
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
