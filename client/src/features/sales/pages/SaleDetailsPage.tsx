// features/sales/pages/SaleDetailsPage.tsx
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Printer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSale } from "../hooks/useSale";
import { useDeleteSale } from "../hooks/useDeleteSale";
import { useSalePayments } from "@/features/payment/hooks/useSalePayments";
import PaymentLedger from "@/features/payment/components/PaymentLedger";
import RecordPaymentDialog from "@/features/payment/components/RecordPaymentDialog";
import CreateReturnDialog from "@/features/returns/components/CreateReturnDialog";
import ReturnStatusBadge from "@/features/returns/components/ReturnStatusBadge";
import { useReturns } from "@/features/returns/hooks/useReturns";
import CorrectSaleItemDialog from "../components/CorrectSaleItemDialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { SaleDetailsItem } from "../types/sale.types";

export default function SaleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id);
  const deleteSale = useDeleteSale();
  const payments = useSalePayments(id);
  const saleReturns = useReturns(id ? { salesId: id } : {}, Boolean(id));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [correctItem, setCorrectItem] = useState<SaleDetailsItem | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading sale...
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-muted-foreground">Sale not found.</p>
        <Button variant="outline" onClick={() => navigate("/sales")}>
          Back to Sales
        </Button>
      </div>
    );
  }

  const hasReturnableItems = sale.items.some(
    (item) => item.quantity > item.returnedQuantity,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/sales")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sales
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          {sale.amountDue > 0 && (
            <Button onClick={() => setPaymentOpen(true)}>Record payment</Button>
          )}
          {hasReturnableItems &&
            (sale.status === "COMPLETED" ||
              sale.status === "PARTIALLY_RETURNED") && (
              <Button variant="outline" onClick={() => setReturnOpen(true)}>
                Return items
              </Button>
            )}
          {sale.status === "COMPLETED" &&
            saleReturns.isSuccess &&
            (saleReturns.data?.items.length ?? 0) === 0 && (
              <Button
                variant="destructive"
                disabled={deleteSale.isPending}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Sale
              </Button>
            )}
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Invoice {sale.invoiceNo}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDateTime(sale.createdAt)}
            </p>
          </div>
          <Badge>{sale.status}</Badge>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Customer</p>
            <p className="font-medium">{sale.customerName || "Walk-in customer"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{sale.customerPhone || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cashier</p>
            <p className="font-medium">{sale.cashierName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment</p>
            <p className="font-medium capitalize">
              {sale.paymentMethod.toLowerCase()}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Disc %</TableHead>
              <TableHead>VAT %</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item) => (
              <TableRow key={item.id ?? item.medicineId}>
                <TableCell className="font-medium">{item.medicineName}</TableCell>
                <TableCell>{item.batchNumber ?? "-"}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                <TableCell>{item.discountPercentage}%</TableCell>
                <TableCell>{item.vatPercentage}%</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.total)}
                </TableCell>
                <TableCell>
                  {item.returnedQuantity === 0 && item.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCorrectItem(item)}
                    >
                      Correct
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span>- {formatCurrency(sale.discountTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT</span>
            <span>{formatCurrency(sale.vatTotal)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Grand Total</span>
            <span>{formatCurrency(sale.grandTotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Paid</span>
            <span>{formatCurrency(sale.paidAmount)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Amount Due</span>
            <span>{formatCurrency(sale.amountDue)}</span>
          </div>
        </div>
      </div>

      <PaymentLedger
        payments={payments.data?.items ?? []}
        isLoading={payments.isLoading}
      />

      {(saleReturns.data?.items.length ?? 0) > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-semibold">Returns</h2>
          <div className="space-y-2">
            {saleReturns.data?.items.map((item) => (
              <Link
                key={item._id}
                to={`/returns/${item._id}`}
                className="hover:bg-muted flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{item.returnNumber}</span>
                <span className="flex items-center gap-3">
                  <ReturnStatusBadge status={item.status} />
                  <span>{formatCurrency(item.refundAmount)}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {paymentOpen && (
        <RecordPaymentDialog
          key={sale.amountDue}
          saleId={sale.id}
          amountDue={sale.amountDue}
          onOpenChange={setPaymentOpen}
        />
      )}

      {returnOpen && (
        <CreateReturnDialog
          sale={sale}
          onOpenChange={setReturnOpen}
        />
      )}

      {correctItem && (
        <CorrectSaleItemDialog
          saleId={sale.id}
          item={correctItem}
          onOpenChange={(open) => !open && setCorrectItem(null)}
        />
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes invoice {sale.invoiceNo} and restores
              the sold stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSale.isPending}>
              Keep Sale
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteSale.isPending}
              onClick={() => {
                deleteSale.mutate(
                  { id: sale.id },
                  {
                    onSuccess: () => {
                      setConfirmDelete(false);
                      navigate("/sales");
                    },
                  },
                );
              }}
            >
              Delete Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
