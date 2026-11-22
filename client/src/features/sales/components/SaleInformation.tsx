// features/sales/components/SaleInformation.tsx
import { CustomerPicker } from "./CustomerPicker";

export function SaleInformation() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <CustomerPicker />

      <div className="space-y-1.5 sm:col-span-2">
        <p className="text-muted-foreground text-xs">
          Leave the name as a walk-in customer, or link a saved customer to
          keep the invoice associated with their record.
        </p>
      </div>
    </div>
  );
}
