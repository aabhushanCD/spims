// features/sales/components/SaleDetailsDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useSale } from "../hooks/useSale";

interface SaleDetailsDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsDialog({
  saleId,
  open,
  onOpenChange,
}: SaleDetailsDialogProps) {
  const { data: sale, isLoading } = useSale(saleId ?? undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        )}

        {sale && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoice</p>
                <p className="font-medium">{sale.invoiceNo}</p>
              </div>
              <Badge>{sale.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p>{sale.customerName || "Walk-in customer"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cashier</p>
                <p>{sale.cashierName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="capitalize">{sale.paymentMethod.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p>{new Date(sale.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              {sale.items.map((item:any) => (
                <div
                  key={item.id ?? item.medicineId}
                  className="flex items-center justify-between text-sm"
                >
                  <div>
                    <p className="font-medium">{item.medicineName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x Rs. {item.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium">Rs. {item.total.toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-1.5 text-sm">
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
              <div className="flex justify-between text-base font-semibold">
                <span>Grand Total</span>
                <span>Rs. {sale.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
