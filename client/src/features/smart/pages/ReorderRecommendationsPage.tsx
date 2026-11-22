import { useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { useAuth } from "@/features/auth/context/authContext";
import ApproveReorderDialog from "../components/ApproveReorderDialog";
import GenerateReorderDialog from "../components/GenerateReorderDialog";
import ManualReorderDialog from "../components/ManualReorderDialog";
import RejectReorderDialog from "../components/RejectReorderDialog";
import { ReorderSummary } from "../components/ReorderSummary";
import ReorderTable from "../components/ReorderTable";
import {
  useDeleteRecommendation,
  useGenerateAllRecommendations,
} from "../hooks/useSmartMutate";
import { useGetRecommendations } from "../hooks/useSmartQuery";
import {
  canDeleteRecommendations,
  canManageRecommendations,
} from "../lib/reorderPermissions";
import { summarizeReorderRecommendations } from "../lib/reorderSummary";
import type {
  ReorderListStatus,
  ReorderRecommendation,
} from "../types/smart.types";

const tabs: { value: ReorderListStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

export default function ReorderRecommendationsPage() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<ReorderListStatus>("PENDING");
  const list = useGetRecommendations(status);
  const summary = useGetRecommendations("ALL");
  const generateAll = useGenerateAllRecommendations();
  const remove = useDeleteRecommendation();

  const canManage = canManageRecommendations(currentUser?.role);
  const isOwner = canDeleteRecommendations(currentUser?.role);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [approving, setApproving] =
    useState<ReorderRecommendation | null>(null);
  const [rejecting, setRejecting] =
    useState<ReorderRecommendation | null>(null);
  const [deleting, setDeleting] = useState<ReorderRecommendation | null>(
    null,
  );

  const summaryValues = useMemo(
    () => summarizeReorderRecommendations(summary.data ?? []),
    [summary.data],
  );

  if (list.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reorder Recommendations"
        description="Review demand-based recommendations and create draft purchase orders."
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setGenerateOpen(true)}
              >
                Generate one
              </Button>
              <Button
                variant="outline"
                disabled={generateAll.isPending}
                onClick={() => generateAll.mutate()}
              >
                {generateAll.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate all
              </Button>
              <Button onClick={() => setManualOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Manual
              </Button>
            </div>
          ) : undefined
        }
      />

      <ReorderSummary
        total={summaryValues.total}
        pending={summaryValues.pending}
        highConfidence={summaryValues.highConfidence}
      />

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={status === tab.value ? "default" : "outline"}
            onClick={() => setStatus(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        <span className="text-muted-foreground ml-auto text-sm">
          {summaryValues.units} suggested units pending
        </span>
      </div>

      {list.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(
            list.error,
            "Failed to load reorder recommendations.",
          )}
        </div>
      ) : (
        <ReorderTable
          recommendations={list.data ?? []}
          canManage={canManage}
          isOwner={isOwner}
          onApprove={setApproving}
          onReject={setRejecting}
          onDelete={setDeleting}
        />
      )}

      {generateOpen && (
        <GenerateReorderDialog onOpenChange={setGenerateOpen} />
      )}

      {manualOpen && <ManualReorderDialog onOpenChange={setManualOpen} />}

      {approving && (
        <ApproveReorderDialog
          recommendation={approving}
          onOpenChange={(open) => !open && setApproving(null)}
        />
      )}

      {rejecting && (
        <RejectReorderDialog
          recommendation={rejecting}
          onOpenChange={(open) => !open && setRejecting(null)}
        />
      )}

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete recommendation?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the recommendation for{" "}
              {deleting?.medicineId.medicineName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (!deleting) return;
                remove.mutate(deleting._id, {
                  onSuccess: () => setDeleting(null),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
