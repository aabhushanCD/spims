// features/sales/components/SaleInformation.tsx
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SaleFormValues } from "../schema/sale.schema";

export function SaleInformation() {
  const { register } = useFormContext<SaleFormValues>();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          placeholder="Walk-in customer"
          {...register("customerName")}
        />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <p className="text-muted-foreground text-xs">
          Customer records will be linked in a later step. For now the name is
          stored as a snapshot on the invoice.
        </p>
      </div>
    </div>
  );
}
