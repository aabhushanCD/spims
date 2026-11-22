import LoadingSpinner from "@/components/common/LoadingSpinner";
import AdjustBatchDialog from "../components/AdjustBatchDialog";
import BatchTable from "../components/BatchTable";
import DeleteBatchDialog from "../components/DeleteBatchDialog";
import { useBatches } from "../hooks/useQueryBatch";
import type { Batch } from "../types/batch.types";
import { useState } from "react";

const BatchPage = () => {
  const { data: batches, isLoading, isError } = useBatches();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [adjustBatch, setAdjustBatch] = useState<Batch | null>(null);

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
        batches={batches?.data ?? []}
        onAdjust={setAdjustBatch}
        onDelete={handleDelete}
      />

      <DeleteBatchDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        batchId={selectedBatchId}
      />

      {adjustBatch && (
        <AdjustBatchDialog
          key={adjustBatch._id}
          open
          onOpenChange={(open) => !open && setAdjustBatch(null)}
          batch={adjustBatch}
        />
      )}
    </div>
  );
};

export default BatchPage;
