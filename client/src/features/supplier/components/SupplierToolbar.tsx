import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onCreate: () => void;
}

export default function SupplierToolbar({ onCreate }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Suppliers</h1>

        <p className="text-muted-foreground">Manage medicine suppliers.</p>
      </div>

      <div className="flex items-center gap-3">
        <Input placeholder="Search supplier..." className="w-64" />

        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>
    </div>
  );
}
