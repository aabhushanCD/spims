import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Boxes } from "lucide-react";
import { InventoryStats } from "../components/InventoryStats";
import { InventoryTable } from "../components/InventoryTable";
import { useInventory } from "../hooks/useInventory";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const stats = [
  {
    title: "Medicines",
    value: "3",
    icon: Boxes,
  },
] satisfies [{ title: string; value: string; icon: typeof Boxes }];

export default function InventoryPage() {
  const { data: inventory, isLoading, error, refetch } = useInventory();
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

        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <InventoryStats stats={stats} />

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />

          <Input placeholder="Search medicine..." className="pl-9" />
        </div>
      </div>

      {inventory && <InventoryTable inventory={inventory} />}
      {!inventory && !isLoading && (
        <div className="text-muted-foreground text-center">
          No inventory data available.
        </div>
      )}
    </div>
  );
}
