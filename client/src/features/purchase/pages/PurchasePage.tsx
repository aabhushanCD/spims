import { useDeferredValue, useState } from "react";

import PurchaseTable from "../components/PurchaseTable";
import PurchaseDialog from "../components/PurchaseDialog";
import CancelPurchaseDialog from "../components/CancelPurchaseDialog";
import PageHeader from "@/components/common/PageToolbar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { usePurchaseList } from "../hooks/usePurchaseList";
import type { PurchaseListItem } from "../types/purchase.types";

const statuses: NonNullable<PurchaseListItem["status"]>[] = [
  "pending",
  "approved",
  "partially_received",
  "received",
  "cancelled",
];

export default function PurchasePage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] =
    useState<PurchaseListItem | null>(null);
  const [cancelPurchase, setCancelPurchase] =
    useState<PurchaseListItem | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PurchaseListItem["status"] | "ALL">(
    "ALL",
  );
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const deferredSearch = useDeferredValue(search);

  const list = usePurchaseList({
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(status === "ALL" ? {} : { status }),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  });

  const purchases = list.data?.pages.flatMap((page) => page.items) ?? [];

  const handleEdit = (purchase: PurchaseListItem) => {
    setEditingPurchase(purchase);
    setOpenDialog(true);
  };

  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) setEditingPurchase(null);
  };

  if (list.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage supplier purchase orders, receiving, invoices, and returns."
        searchPlaceholder="Search invoice number..."
        searchValue={search}
        onSearchChange={setSearch}
        action={
          <PurchaseDialog
            editingPurchase={editingPurchase}
            open={openDialog}
            onOpenChange={handleOpenChange}
          />
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48 space-y-1">
          <label className="text-muted-foreground text-xs">Status</label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as PurchaseListItem["status"] | "ALL")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {statuses.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-44 space-y-1">
          <label className="text-muted-foreground text-xs">From</label>
          <Input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>

        <div className="w-44 space-y-1">
          <label className="text-muted-foreground text-xs">To</label>
          <Input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      {list.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(list.error, "Failed to load purchase orders.")}
        </div>
      ) : (
        <>
          <PurchaseTable
            purchases={purchases}
            onEdit={handleEdit}
            onCancel={setCancelPurchase}
          />

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Showing {purchases.length} purchase order
              {purchases.length === 1 ? "" : "s"}
            </p>

            <Button
              variant="outline"
              size="sm"
              disabled={!list.hasNextPage || list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage
                ? "Loading…"
                : list.hasNextPage
                  ? "Load more"
                  : "No more purchase orders"}
            </Button>
          </div>
        </>
      )}

      {cancelPurchase && (
        <CancelPurchaseDialog
          purchaseId={cancelPurchase._id}
          invoiceNumber={cancelPurchase.invoiceNumber}
          onOpenChange={(open) => !open && setCancelPurchase(null)}
        />
      )}
    </div>
  );
}
