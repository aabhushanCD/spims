import { Eye, Pencil, PackageCheck } from "lucide-react";

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

import { usePurchases } from "../hooks/usePurchases";
import PurchaseDetailsDialog from "./PurchaseDetailsDialog";

interface Props {
  onEdit: (purchase: any) => void;
}

export default function PurchaseTable({ onEdit }: Props) {
  const { data: purchases = [], isLoading } = usePurchases();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-10 text-center">Loading...</CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-10 text-center">
          No purchase orders found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>

              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orderd Date</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead className="w-40">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchases?.map((purchase: any) => (
              <TableRow key={purchase._id}>
                <TableCell>#{purchase._id.slice(20, 25)}</TableCell>

                <TableCell>{purchase.supplierId.companyName}</TableCell>

                <TableCell>Rs. {purchase.totalAmount}</TableCell>

                <TableCell>
                  <Badge>{purchase.status}</Badge>
                </TableCell>

                <TableCell>
                  {new Date(purchase.orderDate).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  {new Date(purchase.expectedDeliveryDate).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  <div className="flex gap-2">
                    <PurchaseDetailsDialog purchaseId={purchase._id} />

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(purchase || undefined)}
                    >
                      <Pencil size={18} />
                    </Button>

                    <Button size="icon" variant="ghost">
                      <PackageCheck size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
