import { useFormContext, useWatch } from "react-hook-form";
import { Banknote, CreditCard, Smartphone, Wallet, QrCode } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PaymentMethod, SaleFormValues } from "../schema/sale.schema";

const PAYMENT_OPTIONS: {
  value: PaymentMethod;
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "QR", label: "QR", icon: QrCode },
  { value: "Mobile Banking", label: "Mobile Banking", icon: Smartphone },
  { value: "CREDIT", label: "Credit", icon: Wallet },
];

interface PaymentSectionProps {
  grandTotal: number;
}

export function PaymentSection({ grandTotal: _grandTotal }: PaymentSectionProps) {
  const { setValue, control } = useFormContext<SaleFormValues>();
  const paymentMethod = useWatch({ control, name: "paymentMethod" });

  return (
    <div className="space-y-3">
      <Label>Payment Method</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              setValue("paymentMethod", value, { shouldValidate: true })
            }
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border py-3 text-sm font-medium transition-colors",
              paymentMethod === value
                ? "border-primary bg-primary/5 text-primary"
                : "border-input hover:bg-accent",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Cash/card/QR/mobile sales are recorded as paid. Credit sales remain
        unpaid until a payment is recorded from the invoice.
      </p>
    </div>
  );
}
