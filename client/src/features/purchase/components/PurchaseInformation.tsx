import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import type { PurchaseForm } from "../schema/purchase.schema";
import SupplierSelect from "./SupplierSelect";

interface Props {
  form: UseFormReturn<PurchaseForm>;
}

export default function PurchaseInformation({ form }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Supplier */}

      <FormField
        control={form.control}
        name="supplierId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Supplier</FormLabel>

            <FormControl>
              <SupplierSelect value={field.value} onChange={field.onChange} />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Invoice */}
      <FormField
        control={form.control}
        name="invoiceNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Invoice Number</FormLabel>

            <FormControl>
              <Input {...field} />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="VAT"
        render={({ field }) => (
          <FormItem>
            <FormLabel>VAT</FormLabel>

            <FormControl>
              <Input {...field} />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
      {/* Purchase Date */}

      <FormField
        control={form.control}
        name="orderDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Purchase Date</FormLabel>

            <FormControl>
              <Input
                type="date"
                value={
                  field.value ? field.value.toISOString().split("T")[0] : ""
                }
                onChange={(e) => {
                  const dateVal = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  field.onChange(dateVal);
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={field.disabled}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Expected Delivery */}

      <FormField
        control={form.control}
        name="expectedDeliveryDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expected Delivery Date</FormLabel>

            <FormControl>
              <Input
                type="date"
                value={
                  field.value ? field.value.toISOString().split("T")[0] : ""
                }
                onChange={(e) => {
                  const dateVal = e.target.value
                    ? new Date(e.target.value)
                    : null;
                  field.onChange(dateVal);
                }}
                onBlur={field.onBlur}
                ref={field.ref}
                disabled={field.disabled}
              />
            </FormControl>

            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
