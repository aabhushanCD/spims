import { useDeferredValue, useState } from "react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";

import CustomerDeleteDialog from "../components/CustomerDeleteDialog";
import CustomerDialog from "../components/CustomerDialog";
import CustomerTable from "../components/CustomerTable";
import { useCustomers } from "../hooks/useCustomers";
import type { Customer } from "../types/customer.types";

export default function CustomerPage() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { data, isLoading, isError, error } = useCustomers(deferredSearch);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage customer records used on sales and invoices."
        searchPlaceholder="Search customers..."
        searchValue={search}
        onSearchChange={setSearch}
        action={
          <CustomerDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) setEditingCustomer(null);
            }}
            editingCustomer={editingCustomer}
          />
        }
      />

      {isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(error, "Failed to load customers.")}
        </div>
      ) : (
        <CustomerTable
          customers={data?.items ?? []}
          onEdit={(customer) => {
            setEditingCustomer(customer);
            setDialogOpen(true);
          }}
          onDelete={setCustomerToDelete}
        />
      )}

      <CustomerDeleteDialog
        customer={customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      />
    </div>
  );
}
