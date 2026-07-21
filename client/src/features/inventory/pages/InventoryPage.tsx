import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Boxes } from "lucide-react";
import { InventoryStats } from "../components/InventoryStats";
import { InventoryTable } from "../components/InventoryTable";

export default function InventoryPage() {
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

        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <InventoryStats />

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />

          <Input placeholder="Search medicine..." className="pl-9" />
        </div>
      </div>

      <InventoryTable />
    </div>
  );
}
