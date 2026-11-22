import { Link } from "react-router";
import { Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  entityLabel,
  type PurchaseReturn,
} from "../types/purchaseReturn.types";
import PurchaseReturnStatusBadge from "./PurchaseReturnStatusBadge";

interface Props {
  returns: PurchaseReturn[];
  isLoading?: boolean;
}

export default function PurchaseReturnTable({ returns, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground p-10 text-center text-sm">
          Loading purchase returns...
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
              <TableHead>Return No.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Purchase order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No purchase returns found.
                </TableCell>
              </TableRow>
            ) : (
              returns.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    {item.returnNumber}
                  </TableCell>
                  <TableCell>{entityLabel(item.supplierId)}</TableCell>
                  <TableCell>{entityLabel(item.purchaseOrderId)}</TableCell>
                  <TableCell>{formatDate(item.returnDate)}</TableCell>
                  <TableCell>
                    <PurchaseReturnStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.refundAmount)}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="icon">
                      <Link
                        to={`/purchase-returns/${item._id}`}
                        aria-label={`View ${item.returnNumber}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
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
