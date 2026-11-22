import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { PurchaseDetails } from "../types/PurchaseDetails";

interface Props {
  purchase?: PurchaseDetails;
}

export default function PurchaseItemsDetailsTable({ purchase }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchase?.items?.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">
                  {item.medicine.medicineName}
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  {item.receivedQuantity}
                </TableCell>
                <TableCell className="text-right">
                  {item.quantityRemaining}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.purchasePrice)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.subtotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
