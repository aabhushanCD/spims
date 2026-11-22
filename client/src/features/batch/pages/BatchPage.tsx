import { useDeferredValue, useState } from "react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import AdjustBatchDialog from "../components/AdjustBatchDialog";
import BatchDisposalDialog from "../components/BatchDisposalDialog";
import BatchFormDialog from "../components/BatchFormDialog";
import BatchHistoryDialog from "../components/BatchHistoryDialog";
import BatchQuantityDialog from "../components/BatchQuantityDialog";
import BatchTable from "../components/BatchTable";
import DeleteBatchDialog from "../components/DeleteBatchDialog";
import { useMarkExpiredBatches } from "../hooks/useMutateBatch";
import {
  useBatches,
  useExpiredAwaitingDisposal,
  useExpiredBatches,
  useLowStockBatches,
} from "../hooks/useQueryBatch";
import type { Batch } from "../types/batch.types";

type BatchView = "all" | "expired" | "disposal" | "low";

const views: { value: BatchView; label: string }[] = [
  { value: "all", label: "All batches" },
  { value: "expired", label: "Expired" },
  { value: "disposal", label: "Awaiting disposal" },
  { value: "low", label: "Low stock" },
];

const BatchPage = () => {
  const [view, setView] = useState<BatchView>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const all = useBatches({ search: deferredSearch }, view === "all");
  const expired = useExpiredBatches(view === "expired");
  const disposal = useExpiredAwaitingDisposal(view === "disposal");
  const low = useLowStockBatches(view === "low");
  const markExpired = useMarkExpiredBatches();

  const active =
    view === "all"
      ? all
      : view === "expired"
        ? expired
        : view === "disposal"
          ? disposal
          : low;

  const batches: Batch[] =
    view === "all"
      ? (all.data?.items ?? [])
      : view === "expired"
        ? (expired.data ?? [])
        : view === "disposal"
          ? (disposal.data ?? [])
          : (low.data ?? []);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [adjustingBatch, setAdjustingBatch] = useState<Batch | null>(null);
  const [increasingBatch, setIncreasingBatch] = useState<Batch | null>(null);
  const [deductingBatch, setDeductingBatch] = useState<Batch | null>(null);
  const [disposingBatch, setDisposingBatch] = useState<Batch | null>(null);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  if (active.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batches"
        description="Track batch stock, expiry, adjustments, and movement history."
        searchPlaceholder="Search batch number..."
        searchValue={search}
        onSearchChange={setSearch}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={markExpired.isPending}
              onClick={() => markExpired.mutate()}
            >
              Mark expired
            </Button>
            <BatchFormDialog
              open={formOpen}
              onOpenChange={(open) => {
                setFormOpen(open);
                if (!open) setEditingBatch(null);
              }}
              editingBatch={editingBatch}
            />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {views.map((option) => (
          <Button
            key={option.value}
            size="sm"
            variant={view === option.value ? "default" : "outline"}
            onClick={() => setView(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {active.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(active.error, "Failed to load batches.")}
        </div>
      ) : (
        <BatchTable
          batches={batches}
          onView={setViewingBatch}
          onEdit={(batch) => {
            setEditingBatch(batch);
            setFormOpen(true);
          }}
          onAdjust={setAdjustingBatch}
          onIncrease={setIncreasingBatch}
          onDeduct={setDeductingBatch}
          onDispose={setDisposingBatch}
          onDelete={(batch) => setDeletingBatchId(batch._id)}
        />
      )}

      {viewingBatch && (
        <BatchHistoryDialog
          batch={viewingBatch}
          onOpenChange={(open) => !open && setViewingBatch(null)}
        />
      )}

      {adjustingBatch && (
        <AdjustBatchDialog
          key={`adjust-${adjustingBatch._id}`}
          open
          onOpenChange={(open) => !open && setAdjustingBatch(null)}
          batch={adjustingBatch}
        />
      )}

      {increasingBatch && (
        <BatchQuantityDialog
          key={`increase-${increasingBatch._id}`}
          mode="increase"
          batch={increasingBatch}
          onOpenChange={(open) => !open && setIncreasingBatch(null)}
        />
      )}

      {deductingBatch && (
        <BatchQuantityDialog
          key={`deduct-${deductingBatch._id}`}
          mode="deduct"
          batch={deductingBatch}
          onOpenChange={(open) => !open && setDeductingBatch(null)}
        />
      )}

      {disposingBatch && (
        <BatchDisposalDialog
          key={`dispose-${disposingBatch._id}`}
          batch={disposingBatch}
          onOpenChange={(open) => !open && setDisposingBatch(null)}
        />
      )}

      <DeleteBatchDialog
        open={Boolean(deletingBatchId)}
        setOpen={(open) => !open && setDeletingBatchId(null)}
        batchId={deletingBatchId}
      />
    </div>
  );
};

export default BatchPage;
