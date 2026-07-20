// features/sales/components/PaymentSection.tsx
import { useFormContext, useWatch } from "react-hook-form";
import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PaymentMethod, SaleFormValues } from "../schema/sale.schema";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "ESEWA", label: "eSewa", icon: Smartphone },
  { value: "KHALTI", label: "Khalti", icon: Wallet },
];

interface PaymentSectionProps {
  grandTotal: number;
}

export function PaymentSection({ grandTotal }: PaymentSectionProps) {
  const { setValue, control, register } = useFormContext<SaleFormValues>();
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const paidAmount = useWatch({ control, name: "paidAmount" });

  const change =
    typeof paidAmount === "number" && paidAmount > grandTotal
      ? paidAmount - grandTotal
      : 0;

  return (
    <div className="space-y-3">
      <Label>Payment Method</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setValue("paymentMethod", value, { shouldValidate: true })}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition-colors",
              paymentMethod === value
                ? "border-primary bg-primary/5 text-primary"
                : "border-input hover:bg-accent"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>

      {paymentMethod === "CASH" && (
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="paidAmount">Paid Amount</Label>
            <Input
              id="paidAmount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              {...register("paidAmount", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Change</Label>
            <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm font-medium">
              Rs. {change.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
