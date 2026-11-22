import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod } from "@/features/sales/schema/sale.schema";
import { formatCurrency } from "@/lib/format";
import { validatePaymentAmount } from "../lib/validatePayment";
import { useAddSalePayment } from "../hooks/useSalePayments";

interface Props {
  saleId: string;
  amountDue: number;
  onOpenChange: (open: boolean) => void;
}

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const methods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "QR", label: "QR" },
  { value: "Mobile Banking", label: "Mobile Banking" },
  { value: "CREDIT", label: "Credit" },
];

export default function RecordPaymentDialog({
  saleId,
  amountDue,
  onOpenChange,
}: Props) {
  const addPayment = useAddSalePayment(saleId);
  const [amount, setAmount] = useState(String(amountDue));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const value = Number(amount);
    const validationError = validatePaymentAmount(value, amountDue);

    if (validationError) {
      setError(
        validationError ===
          "Payment cannot exceed the outstanding amount"
          ? `Payment cannot exceed ${formatCurrency(amountDue)}`
          : validationError,
      );
      return;
    }

    setError(null);
    addPayment.mutate(
      {
        amount: value,
        method,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        idempotencyKey: createIdempotencyKey(),
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Outstanding balance: {formatCurrency(amountDue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-amount">Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min={0.01}
              max={amountDue}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select
              value={method}
              onValueChange={(value) => setMethod(value as PaymentMethod)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {methods.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-reference">Reference</Label>
            <Input
              id="payment-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Optional transaction reference"
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={addPayment.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addPayment.isPending}>
            {addPayment.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
