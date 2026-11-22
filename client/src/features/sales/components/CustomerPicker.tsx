import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Loader2, Plus, Search, UserRound, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CustomerDialog from "@/features/customer/components/CustomerDialog";
import { useCustomers } from "@/features/customer/hooks/useCustomers";
import type { Customer } from "@/features/customer/types/customer.types";
import type { SaleFormValues } from "../schema/sale.schema";
import { useDebouncedValue } from "../hooks/useDebouncedValue";

export function CustomerPicker() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<SaleFormValues>();

  const customerId = watch("customerId");
  const customerName = watch("customerName");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 250);
  const customers = useCustomers(debouncedQuery);

  const nameRegistration = register("customerName");

  function handleSelect(customer: Customer) {
    setValue("customerId", customer._id, { shouldValidate: true });
    setValue("customerName", customer.name, { shouldValidate: true });
    setOpen(false);
    setQuery("");
  }

  function handleClear() {
    setValue("customerId", undefined);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="customerName">Customer</Label>

      <div className="flex gap-2">
        <Input
          id="customerName"
          placeholder="Walk-in customer"
          {...nameRegistration}
          onChange={(event) => {
            nameRegistration.onChange(event);
            if (customerId) {
              handleClear();
            }
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="shrink-0">
              <Search className="mr-2 h-4 w-4" />
              Find
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved customers..."
              autoFocus
            />

            <div className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {customers.isLoading && (
                <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading customers...
                </div>
              )}

              {!customers.isLoading && customers.data?.items.length === 0 && (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  No customers found.
                </p>
              )}

              {customers.data?.items.map((customer) => (
                <button
                  key={customer._id}
                  type="button"
                  onClick={() => handleSelect(customer)}
                  className="hover:bg-muted flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm"
                >
                  <UserRound className="text-muted-foreground mt-0.5 h-4 w-4" />
                  <span>
                    <span className="block font-medium">{customer.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {customer.phone ?? customer.email ?? "No contact"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setCreateOpen(true)}
          aria-label="Create customer"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {customerId && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Linked customer</Badge>
          <span className="text-muted-foreground text-xs">{customerName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            aria-label="Unlink customer"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {errors.customerName && (
        <p className="text-destructive text-xs">
          {errors.customerName.message}
        </p>
      )}

      <CustomerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleSelect}
        hideTrigger
      />
    </div>
  );
}
