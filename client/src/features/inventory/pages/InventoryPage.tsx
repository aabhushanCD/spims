import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Search,
  Boxes,
  PackageX,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { InventoryStats } from "../components/InventoryStats";
import { InventoryTable } from "../components/InventoryTable";
import ReserveStockDialog from "../components/ReserveStockDialog";
import { useInventory } from "../hooks/useInventory";
import type { InventoryItem } from "../types/inventory.types";
import { useInventoryAnalytics } from "../hooks/useInventoryAnalytics";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { formatCurrency } from "@/lib/format";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const { data: inventory, isLoading, error, refetch } = useInventory(search);
  const analytics = useInventoryAnalytics();
  const [stockAction, setStockAction] = useState<{
    item: InventoryItem;
    mode: "reserve" | "release";
  } | null>(null);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading inventory data.
      </div>
    );
  }

  const stats = [
    {
      title: "Inventory Value",
      value: analytics.data
        ? formatCurrency(analytics.data.totalValue)
        : "—",
      icon: Wallet,
    },
    {
      title: "Low Stock",
      value:
        analytics.data !== undefined
          ? String(analytics.data.lowStockCount)
          : "—",
      icon: TriangleAlert,
    },
    {
      title: "Out of Stock",
      value:
        analytics.data !== undefined
          ? String(analytics.data.outOfStockCount)
          : "—",
      icon: PackageX,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Boxes className="text-primary h-8 w-8" />
            Inventory
          </h1>

          <p className="text-muted-foreground">
            Monitor medicine stock levels.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/inventory/movements">Movements</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/inventory/reconciliation">Reconciliation</Link>
          </Button>
          <Button onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <InventoryStats stats={stats} />

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />

          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medicine..."
            className="pl-9"
          />
        </div>
      </div>

      {inventory && (
        <InventoryTable
          inventory={inventory}
          onAction={(item, mode) => setStockAction({ item, mode })}
        />
      )}
      {!inventory && (
        <div className="text-muted-foreground text-center">
          No inventory data available.
        </div>
      )}

      {stockAction && (
        <ReserveStockDialog
          key={`${stockAction.mode}-${stockAction.item._id}`}
          mode={stockAction.mode}
          item={stockAction.item}
          onOpenChange={(open) => !open && setStockAction(null)}
        />
      )}
    </div>
  );
}
