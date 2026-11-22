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
import { formatCurrency, formatDate } from "@/lib/format";
import { useSupplierLedger } from "../hooks/usePurchaseReturns";

interface Props {
  supplierId: string;
  companyName: string;
  onOpenChange: (open: boolean) => void;
}

export default function SupplierLedgerDialog({
  supplierId,
  companyName,
  onOpenChange,
}: Props) {
  const ledger = useSupplierLedger(supplierId);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Supplier credit ledger</DialogTitle>
          <DialogDescription>{companyName}</DialogDescription>
        </DialogHeader>

        {ledger.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : ledger.isError || !ledger.data ? (
          <p className="text-destructive text-sm">
            Could not load the supplier ledger.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-muted-foreground text-xs">Credit balance</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(ledger.data.balance)}
              </p>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.data.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-16 text-center">
                        No ledger entries.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ledger.data.entries.map((entry) => (
                      <TableRow key={entry._id}>
                        <TableCell>{formatDate(entry.createdAt)}</TableCell>
                        <TableCell>{entry.type}</TableCell>
                        <TableCell>{entry.reference}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.balanceAfter)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
