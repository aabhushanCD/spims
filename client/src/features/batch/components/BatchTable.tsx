import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Batch } from "../types/batch.types";
import { BatchExpiryBadge } from "./BatchExpiryBadge";
import { BatchStatusBadge } from "./BatchStatusBadge";
import { BatchActions } from "./BatchActions";

interface Props {
  batches: Batch[];

  onView: (batch: Batch) => void;

  onEdit: (batch: Batch) => void;

  onDelete: (id: string) => void;
}

export default function BatchTable({
  batches,
  onView,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medicine</TableHead>

            <TableHead>Batch No</TableHead>

            <TableHead>Expiry</TableHead>

            <TableHead>Received</TableHead>

            <TableHead>Remaining</TableHead>

            <TableHead>Status</TableHead>

            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No batches found
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow key={batch._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {batch.medicineId?.medicineName}
                    </p>

                    <p className="text-muted-foreground text-sm">
                      {batch.medicineId?.strength}
                    </p>
                  </div>
                </TableCell>

                <TableCell>{batch.batchNumber}</TableCell>

                <TableCell>
                  <BatchExpiryBadge expiryDate={batch.expiryDate} />
                </TableCell>

                <TableCell>{batch.quantityReceived}</TableCell>

                <TableCell>{batch.quantityRemaining}</TableCell>

                <TableCell>
                  <BatchStatusBadge batch={batch} />
                </TableCell>

                <TableCell>
                  <BatchActions
                    batch={batch}

                    onView={onView}

                    onEdit={onEdit}

                    onDelete={onDelete}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
