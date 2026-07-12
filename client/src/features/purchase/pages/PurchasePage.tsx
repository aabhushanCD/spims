import { useState } from "react";

import PurchaseTable from "../components/PurchaseTable";
import PurchaseDialog from "../components/PurchaseDialog";
import PageHeader from "@/components/common/PageToolbar";

export default function PurchasePage() {
  const [open, setOpen] = useState(false);

  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage medicine purchase orders."
        searchPlaceholder="Search purchase..."
        searchValue={search}
        onSearchChange={setSearch}
        action={<PurchaseDialog open={open} onOpenChange={setOpen} />}
      />

      <PurchaseTable />
    </div>
  );
}
