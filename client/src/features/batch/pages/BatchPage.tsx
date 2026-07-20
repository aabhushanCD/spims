import LoadingSpinner from "@/components/common/LoadingSpinner";
import BatchTable from "../components/BatchTable";
import DeleteBatchDialog from "../components/DeleteBatchDialog";
import { useBatches } from "../hooks/useQueryBatch";
import type { Batch } from "../types/batch.types";
import { useState } from "react";

const BatchPage = () => {
  const { data: batches, isLoading, isError } = useBatches();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  function handleView(batch: Batch) {
    // e.g. open a view modal or navigate to a detail page
    console.log("view", batch);
  }

  function handleEdit(batch: Batch) {
    // e.g. open an edit modal/form with this batch
    console.log("edit", batch);
  }

  function handleDelete(id: string) {
    setSelectedBatchId(id);
    setDeleteOpen(true);
  }
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <div>Error loading batches.</div>;
  }

  return (
    <div>
      <BatchTable
        batches={batches.data}

        onView={handleView}

        onEdit={handleEdit}

        onDelete={handleDelete}
      />

      <DeleteBatchDialog
        open={deleteOpen}

        setOpen={setDeleteOpen}

        batchId={selectedBatchId}
      />
    </div>
  );
};

export default BatchPage;
