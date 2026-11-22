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
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { useSupplierPerformance } from "../hooks/useSupplierPerformance";

interface Props {
  supplierId: string;
  companyName: string;
  onOpenChange: (open: boolean) => void;
}

export default function SupplierPerformanceDialog({
  supplierId,
  companyName,
  onOpenChange,
}: Props) {
  const performance = useSupplierPerformance(supplierId);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supplier performance</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        {performance.isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : performance.isError || !performance.data ? (
          <p className="text-destructive text-sm">
            Could not load supplier performance.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Orders" value={String(performance.data.totalOrders)} />
              <Metric
                label="Received"
                value={String(performance.data.receivedOrders)}
              />
              <Metric
                label="On time"
                value={
                  performance.data.onTimeRate === null
                    ? "—"
                    : formatPercent(performance.data.onTimeRate)
                }
              />
              <Metric
                label="Avg delay"
                value={`${performance.data.averageDelayDays} d`}
              />
              <Metric
                label="Value"
                value={formatCurrency(performance.data.totalValue)}
              />
              <Metric
                label="Reliability"
                value={
                  performance.data.supplier.reliabilityScore === undefined
                    ? "—"
                    : String(performance.data.supplier.reliabilityScore)
                }
              />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Recent orders</h3>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Ordered</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.data.recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-16 text-center">
                          No received orders.
                        </TableCell>
                      </TableRow>
                    ) : (
                      performance.data.recentOrders.map((order) => (
                        <TableRow key={order._id}>
                          <TableCell>{order.invoiceNumber}</TableCell>
                          <TableCell>{formatDate(order.orderDate)}</TableCell>
                          <TableCell>
                            {order.receivedDate
                              ? formatDate(order.receivedDate)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(order.totalAmount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
