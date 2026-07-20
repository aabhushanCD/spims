// features/sales/components/SalesTable.tsx
import { useNavigate } from "react-router";
import { MoreHorizontal, Eye, Ban, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SalesListItem } from "../types/sale.types";

interface SalesTableProps {
  sales: SalesListItem[];
  isLoading?: boolean;
  onCancel: (sale: SalesListItem) => void;
}

export function SalesTable({ sales, isLoading, onCancel }: SalesTableProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sales...
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-1 py-16 text-center text-sm">
        No sales found. Click "New Sale" to record one.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No.</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow
              key={sale._id}
              className="cursor-pointer"
              onClick={() => navigate(`/sales/${sale._id}`)}
            >
              <TableCell className="font-medium">
                {sale.invoiceNumber}
              </TableCell>
              <TableCell>{sale?.cashierId?.name}</TableCell>
              <TableCell>{sale.customerName}</TableCell>
              <TableCell className="capitalize">
                {sale.paymentMethod.toLowerCase()}
              </TableCell>
              <TableCell className="text-right">
                Rs. {sale?.totalAmount?.toFixed(2)}
              </TableCell>

              <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/sales/${sale._id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={sale.status !== "COMPLETED"}
                      onClick={() => onCancel(sale)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" /> Cancel sale
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
