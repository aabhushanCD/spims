import { Trash2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { PurchaseForm } from "../schema/purchase.schema";

import MedicineSelect from "./MedicineSelect";

interface Props {
  form: UseFormReturn<PurchaseForm>;

  index: number;

  remove: (index: number) => void;

  canDelete: boolean;
}

export default function PurchaseItemRow({
  form,
  index,
  remove,
  canDelete,
}: Props) {
  const quantity = form.watch(`items.${index}.quantity`) || 0;

  const price = form.watch(`items.${index}.purchasePrice`) || 0;

  const total = quantity * price;

  return (
    <div className="grid grid-cols-12 items-end gap-3">
      {/* Medicine */}

      <FormField
        control={form.control}
        name={`items.${index}.medicineId`}
        render={({ field }) => (
          <FormItem className="col-span-5">
            <MedicineSelect value={field.value} onChange={field.onChange} />

            <FormMessage />
          </FormItem>
        )}
      />

      {/* Qty */}

      <FormField
        control={form.control}
        name={`items.${index}.quantity`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormControl>
              <Input type="number" min={1} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Price */}

      <FormField
        control={form.control}
        name={`items.${index}.purchasePrice`}
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormControl>
              <Input type="number" min={0} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Total */}

      <div className="col-span-2 flex h-10 items-center font-semibold">
        Rs. {total.toFixed(2)}
      </div>

      {/* Delete */}

      <div className="col-span-1">
        {canDelete && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
