// features/sales/pages/SalesPage.tsx
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useSales } from "../hooks/useSales";
import { useDeleteSale } from "../hooks/useDeleteSale";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { SalesTable } from "../components/SalesTable";
import { SaleDialog } from "../components/SaleDialog";
import type { SalesListItem } from "../types/sale.types";

export default function SalesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saleToDelete, setSaleToDelete] = useState<SalesListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isFetching, isError, error } = useSales({
    search: debouncedSearch,
  });
  const deleteSale = useDeleteSale();

  const handleConfirmDelete = () => {
    if (!saleToDelete) return;
    deleteSale.mutate(
      { id: saleToDelete._id },
      { onSuccess: () => setSaleToDelete(null) },
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Sale
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice, customer, cashier..."
          className="pl-9"
        />
      </div>

      {isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(error, "Failed to load sales.")}
        </div>
      ) : (
        <SalesTable
          sales={data?.data ?? []}
          isLoading={isLoading || isFetching}
          onDelete={setSaleToDelete}
        />
      )}

      <SaleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <AlertDialog
        open={Boolean(saleToDelete)}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes invoice{" "}
              <span className="font-medium">{saleToDelete?.invoiceNumber}</span>{" "}
              and restores the sold stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSale.isPending}>
              Keep Sale
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
