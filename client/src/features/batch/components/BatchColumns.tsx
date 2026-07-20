import type { Batch } from "../types/batch.types";
import type { ColumnDef } from "@tanstack/react-table";

export const batchColumns: ColumnDef<Batch>[] = [
  {
    accessorKey: "batchNumber",

    header: "Batch No",
  },

  {
    accessorKey: "quantityRemaining",

    header: "Remaining",
  },

  {
    accessorKey: "expiryDate",

    header: "Expiry",
  },
];
