import { useState } from "react";

import PurchaseTable from "../components/PurchaseTable";
import PurchaseDialog from "../components/PurchaseDialog";
import PageHeader from "@/components/common/PageToolbar";

export default function PurchasePage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [search, setSearch] = useState("");

  const handleEdit = (purchase: any) => {
    setEditingPurchase(purchase);
    setOpenDialog(true);
  };
  const handleOpenChange = (open: boolean) => {
    setOpenDialog(open);
    if (!open) {
      setEditingPurchase(null);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage medicine purchase orders."
        searchPlaceholder="Search purchase..."
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

      <PurchaseTable onEdit={handleEdit} />
    </div>
  );
}
