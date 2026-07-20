import type { ColumnDef } from "@tanstack/react-table";

import type { Batch } from "../types/batch";

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
