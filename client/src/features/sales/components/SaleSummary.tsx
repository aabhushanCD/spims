// features/sales/components/SaleSummary.tsx
import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Separator } from "@/components/ui/separator";
import type { SaleFormValues } from "../schema/sale.schema";

export interface SaleTotals {
  subtotal: number;
  discountTotal: number;
  vatTotal: number;
  grandTotal: number;
}

export function computeSaleTotals(items: SaleFormValues["items"] = []): SaleTotals {
  return items.reduce<SaleTotals>(
    (acc, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const base = quantity * unitPrice;
      const discount = base * ((item.discountPercentage || 0) / 100);
      const taxable = base - discount;
      const vat = taxable * ((item.vatPercentage || 0) / 100);

      return {
        subtotal: acc.subtotal + base,
        discountTotal: acc.discountTotal + discount,
        vatTotal: acc.vatTotal + vat,
        grandTotal: acc.grandTotal + taxable + vat,
      };
    },
    { subtotal: 0, discountTotal: 0, vatTotal: 0, grandTotal: 0 }
  );
}

interface SaleSummaryProps {
  onTotalsChange?: (totals: SaleTotals) => void;
}

export function SaleSummary({ onTotalsChange }: SaleSummaryProps) {
  const { control } = useFormContext<SaleFormValues>();
  const items = useWatch({ control, name: "items" });

  const totals = useMemo(() => computeSaleTotals(items), [items]);

  // Side effects (like lifting totals up to the dialog for PaymentSection)
  // belong in an effect, not inside useMemo.
  useEffect(() => {
    onTotalsChange?.(totals);
  }, [totals, onTotalsChange]);

  const row = (label: string, value: number, emphasis = false) => (
    <div
      className={
        emphasis
          ? "flex items-center justify-between text-base font-semibold"
          : "flex items-center justify-between text-sm text-muted-foreground"
      }
    >
      <span>{label}</span>
      <span className={emphasis ? "text-foreground" : ""}>
        Rs. {value.toFixed(2)}
      </span>
    </div>
  );

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
      {row("Subtotal", totals.subtotal)}
      {row("Discount", -totals.discountTotal)}
      {row("VAT", totals.vatTotal)}
      <Separator className="my-1" />
      {row("Grand Total", totals.grandTotal, true)}
    </div>
  );
}
