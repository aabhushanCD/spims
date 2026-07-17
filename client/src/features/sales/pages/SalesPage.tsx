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
import { useCancelSale } from "../hooks/useCancelSale";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { SalesTable } from "../components/SalesTable";
import { SaleDialog } from "../components/SaleDialog";
import type { SaleListItem } from "../types/sale.types";

export default function SalesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saleToCancel, setSaleToCancel] = useState<SaleListItem | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading, isFetching } = useSales({ search: debouncedSearch });
  const cancelSale = useCancelSale();

  const handleConfirmCancel = () => {
    if (!saleToCancel) return;
    cancelSale.mutate(
      { id: saleToCancel.id },
      { onSuccess: () => setSaleToCancel(null) }
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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by invoice, customer, cashier..."
          className="pl-9"
        />
      </div>

      <SalesTable
        sales={data?.data ?? []}
        isLoading={isLoading || isFetching}
        onCancel={setSaleToCancel}
      />

      <SaleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

      <AlertDialog
        open={Boolean(saleToCancel)}
        onOpenChange={(open) => !open && setSaleToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel invoice{" "}
              <span className="font-medium">{saleToCancel?.invoiceNo}</span> and
              restore the sold stock. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelSale.isPending}>
              Keep Sale
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelSale.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
