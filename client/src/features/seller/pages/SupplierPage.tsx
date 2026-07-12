import { useState } from "react";
import type { Supplier } from "../types/supplier.types";

import SupplierTable from "../components/SupplierTable";
import AddSupplierDialog from "../components/AddSupplierDialog";
import { useSupplier } from "../hooks/useSuppliers";
import PageHeader from "@/components/common/PageToolbar";

export default function SupplierPage() {
  const { data: suppliers = [], isLoading } = useSupplier();

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage supplier information"
        searchPlaceholder="Search supplier..."
        action={<AddSupplierDialog editingSupplier={editingSupplier} />}
      />
      <SupplierTable
        suppliers={suppliers}
        isLoading={isLoading}
        onEdit={handleEdit}
      />
    </div>
  );
}
