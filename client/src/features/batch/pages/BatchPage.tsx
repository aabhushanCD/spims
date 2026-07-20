import { useState } from "react";
import DeleteBatchDialog from "../components/DeleteBatchDialog";
import BatchTable from "../components/BatchTable";
import { useBatches } from "../hooks/useQueryBatch";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const BatchPage = () => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: batches, isLoading, error } = useBatches();

  if (isLoading)
    return (
      <div>
        <LoadingSpinner />
      </div>
    );
  return (
    <div>
      <BatchTable
        batches={batches.data}

        onView={setSelectedBatch}

        onEdit={setEditBatch}

        onDelete={(id) => {
          setDeleteId(id);

          setDeleteOpen(true);
        }}
      />

      <DeleteBatchDialog
        open={deleteOpen}

        setOpen={setDeleteOpen}

        batchId={deleteId}
      />
    </div>
  );
};

export default BatchPage;
