import { useState } from "react";
import { Plus } from "lucide-react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import CreatePurchaseReturnDialog from "../components/CreatePurchaseReturnDialog";
import PurchaseReturnTable from "../components/PurchaseReturnTable";
import { usePurchaseReturns } from "../hooks/usePurchaseReturns";
import type { PurchaseReturnStatus } from "../types/purchaseReturn.types";

const statuses: PurchaseReturnStatus[] = [
  "PENDING",
  "APPROVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

export default function PurchaseReturnsPage() {
  const [status, setStatus] = useState<PurchaseReturnStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const returns = usePurchaseReturns(
    status === "ALL" ? {} : { status },
  );

  if (returns.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Returns"
        description="Return received stock to suppliers and track supplier credits."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as PurchaseReturnStatus | "ALL")
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create return
            </Button>
          </div>
        }
      />

      {returns.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(
            returns.error,
            "Failed to load purchase returns.",
          )}
        </div>
      ) : (
        <PurchaseReturnTable returns={returns.data?.items ?? []} />
      )}

      {createOpen && (
        <CreatePurchaseReturnDialog onOpenChange={setCreateOpen} />
      )}
    </div>
  );
}
