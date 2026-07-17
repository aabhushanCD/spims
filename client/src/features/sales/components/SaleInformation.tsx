// features/sales/components/SaleInformation.tsx
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SaleFormValues } from "../schema/sale.schema";

export function SaleInformation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SaleFormValues>();

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

      <div className="space-y-1.5">
        <Label htmlFor="customerPhone">Customer Phone</Label>
        <Input
          id="customerPhone"
          placeholder="98XXXXXXXX"
          {...register("customerPhone")}
        />
        {errors.customerPhone && (
          <p className="text-xs text-destructive">{errors.customerPhone.message}</p>
        )}
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Optional note for this sale"
          rows={2}
          {...register("notes")}
        />
      </div>
    </div>
  );
}
