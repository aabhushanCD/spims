// features/sales/pages/SaleDetailsPage.tsx
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Ban, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSale } from "../hooks/useSale";
import { useCancelSale } from "../hooks/useCancelSale";

export default function SaleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sale, isLoading } = useSale(id);
  const cancelSale = useCancelSale();

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
          {sale.status === "COMPLETED" && (
            <Button
              variant="destructive"
              disabled={cancelSale.isPending}
              onClick={() => cancelSale.mutate({ id: sale.id })}
            >
              <Ban className="mr-2 h-4 w-4" /> Cancel Sale
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Invoice {sale.invoiceNo}</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(sale.createdAt).toLocaleString()}
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
              <TableHead>Qty</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Disc %</TableHead>
              <TableHead>VAT %</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items.map((item:any) => (
              <TableRow key={item.id ?? item.medicineId}>
                <TableCell className="font-medium">{item.medicineName}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>Rs. {item.unitPrice.toFixed(2)}</TableCell>
                <TableCell>{item.discountPercentage}%</TableCell>
                <TableCell>{item.vatPercentage}%</TableCell>
                <TableCell className="text-right">
                  Rs. {item.total.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="ml-auto mt-4 w-full max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>Rs. {sale.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Discount</span>
            <span>- Rs. {sale.discountTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>VAT</span>
            <span>Rs. {sale.vatTotal.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-base font-semibold">
            <span>Grand Total</span>
            <span>Rs. {sale.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {sale.notes && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{sale.notes}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
