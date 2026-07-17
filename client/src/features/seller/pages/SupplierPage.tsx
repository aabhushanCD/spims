import { useState } from "react";
import type { Supplier } from "../types/supplier.types";

import SupplierTable from "../components/SupplierTable";
import AddSupplierDialog from "../components/AddSupplierDialog";
import { useSupplier } from "../hooks/useSuppliers";
import PageHeader from "@/components/common/PageToolbar";

export default function SupplierPage() {
  const { data: suppliers = [], isLoading } = useSupplier();

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  }
  function handleOpenChange(open: boolean) {
    setDialogOpen(open);

    if (!open) {
      setEditingSupplier(null);
    }
  }
  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier information"
        searchPlaceholder="Search supplier..."
        action={
          <AddSupplierDialog
            open={dialogOpen}
            onOpenChange={handleOpenChange}
            editingSupplier={editingSupplier}
          />
        }
      />
      <SupplierTable
        suppliers={suppliers}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
    </div>
  );
}
