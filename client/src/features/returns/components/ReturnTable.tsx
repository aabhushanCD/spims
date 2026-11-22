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
import type { SalesReturn } from "../types/return.types";
import ReturnStatusBadge from "./ReturnStatusBadge";

interface Props {
  returns: SalesReturn[];
  isLoading?: boolean;
}

export default function ReturnTable({ returns, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Loading returns...
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
              <TableHead>Sale</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Refund</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No returns found.
                </TableCell>
              </TableRow>
            ) : (
              returns.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    {item.returnNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    #{String(item.salesId).slice(-6)}
                  </TableCell>
                  <TableCell>{formatDate(item.returnDate)}</TableCell>
                  <TableCell>
                    <ReturnStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.refundAmount)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to={`/returns/${item._id}`}
                        aria-label={`View return ${item.returnNumber}`}
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
