import { Link } from "react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { useInventory } from "../hooks/useInventory";
import { useReconciliation, useSyncInventory } from "../hooks/useMovements";

export default function ReconciliationPage() {
  const reconciliation = useReconciliation();
  const inventory = useInventory();
  const sync = useSyncInventory();

  const names = new Map(
    (inventory.data?.data ?? []).map((item) => [
      item.medicineId._id,
      item.medicineId.medicineName,
    ]),
  );

  if (reconciliation.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Button asChild variant="ghost" size="icon">
              <Link to="/stock" aria-label="Back to inventory">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            Stock reconciliation
          </h1>
          <p className="text-muted-foreground text-sm">
            Compare aggregate inventory against batch stock.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => reconciliation.refetch()}
          disabled={reconciliation.isFetching}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {reconciliation.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(
            reconciliation.error,
            "Failed to load reconciliation report.",
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-right">Aggregate</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Batch stock</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reconciliation.data?.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No reconciliation rows found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reconciliation.data?.map((row) => (
                    <TableRow key={row.inventoryId}>
                      <TableCell className="font-medium">
                        {names.get(row.medicineId) ??
                          `Medicine ${row.medicineId.slice(-6)}`}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.aggregateStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.reservedStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.batchStock}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.variance}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={row.reconciled ? "default" : "destructive"}
                        >
                          {row.reconciled ? "Reconciled" : "Variance"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sync.isPending}
                          onClick={() =>
                            sync.mutate({ medicineId: row.medicineId })
                          }
                        >
                          Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
