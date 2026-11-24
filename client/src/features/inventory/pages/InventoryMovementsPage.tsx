import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import RelativeTime from "@/components/common/RelativeTime";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { useMovements } from "../hooks/useMovements";
import type { MovementType } from "../types/inventory.types";

const movementTypes: MovementType[] = [
  "PURCHASE",
  "SALE",
  "RETURN",
  "ADJUSTMENT",
  "EXPIRED",
  "RESERVE",
  "RELEASE",
  "PURCHASE_RETURN",
];

export default function InventoryMovementsPage() {
  const [movementType, setMovementType] = useState<MovementType | "ALL">("ALL");
  const movements = useMovements(
    movementType === "ALL" ? {} : { movementType },
  );

  if (movements.isLoading) {
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
            Inventory movements
          </h1>
          <p className="text-muted-foreground text-sm">
            Audit trail for every stock change.
          </p>
        </div>

        <Select
          value={movementType}
          onValueChange={(value) =>
            setMovementType(value as MovementType | "ALL")
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Movement type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All movements</SelectItem>
            {movementTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {movements.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(movements.error, "Failed to load movements.")}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(movements.data?.items.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      No movements found.
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.data?.items.map((movement) => (
                    <TableRow key={movement._id}>
                      <TableCell>
                        <RelativeTime value={movement.createdAt} />
                      </TableCell>
                      <TableCell>
                        {movement.medicineId?.medicineName ?? "-"}
                      </TableCell>
                      <TableCell>
                        {movement.batchId?.batchNumber ?? "-"}
                      </TableCell>
                      <TableCell>{movement.movementType}</TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell className="text-xs">
                        {movement.referenceType}
                      </TableCell>
                      <TableCell>
                        {movement.performedBy?.name ?? "-"}
                      </TableCell>
                      <TableCell>{movement.remarks || "-"}</TableCell>
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
