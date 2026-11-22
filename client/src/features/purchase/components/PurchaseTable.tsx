import { Pencil, XCircle } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";

import PurchaseDetailsDialog from "./PurchaseDetailsDialog";
import type { PurchaseListItem } from "../types/purchase.types";

interface Props {
  purchases: PurchaseListItem[];
  isLoading?: boolean;
  onEdit: (purchase: PurchaseListItem) => void;
  onCancel: (purchase: PurchaseListItem) => void;
}

function statusVariant(status: PurchaseListItem["status"]) {
  switch (status) {
    case "received":
      return "default" as const;
    case "partially_received":
      return "secondary" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default function PurchaseTable({
  purchases,
  isLoading,
  onEdit,
  onCancel,
}: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-10 text-center">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase._id}>
                  <TableCell className="font-medium">
                    {purchase.invoiceNumber}
                  </TableCell>

                  <TableCell>{purchase.supplierId.companyName}</TableCell>

                  <TableCell className="text-right">
                    {formatCurrency(purchase.totalAmount)}
                  </TableCell>

                  <TableCell>
                    <Badge variant={statusVariant(purchase.status)}>
                      {purchase.status.replace("_", " ")}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatDate(purchase.orderDate)}</TableCell>

                  <TableCell>
                    {purchase.expectedDeliveryDate
                      ? formatDate(purchase.expectedDeliveryDate)
                      : "-"}
                  </TableCell>

                  <TableCell>
                    <div className="flex gap-1">
                      <PurchaseDetailsDialog purchaseId={purchase._id} />

                      {purchase.status === "pending" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Edit purchase order ${purchase.invoiceNumber}`}
                          onClick={() => onEdit(purchase)}
                        >
                          <Pencil size={18} />
                        </Button>
                      )}

                      {(purchase.status === "pending" ||
                        purchase.status === "approved") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Cancel purchase order ${purchase.invoiceNumber}`}
                          onClick={() => onCancel(purchase)}
                        >
                          <XCircle size={18} className="text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
