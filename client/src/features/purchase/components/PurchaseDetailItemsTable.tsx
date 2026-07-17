import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";

interface Props {
  purchase: any;
}

export default function PurchaseItemsDetailsTable({ purchase }: Props) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>

              <TableHead>Batch</TableHead>

              <TableHead>Quantity</TableHead>

              <TableHead>Price</TableHead>

              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {purchase?.data.items?.map((item: any) => (
              <TableRow key={item._id}>
                <TableCell>{item.medicine.medicineName}</TableCell>

                <TableCell>{item.batchNumber ?? "-"}</TableCell>

                <TableCell>{item.quantity}</TableCell>

                <TableCell>Rs. {item.purchasePrice}</TableCell>

                <TableCell>Rs. {item.quantity * item.purchasePrice}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
