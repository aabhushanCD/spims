import { roundCurrency } from "../../../shared/finance/money.ts";

export interface PurchaseTotalsInput {
  items: Array<{ quantity: number; purchasePrice: number }>;
  discount: number;
  /** VAT percentage, e.g. 13 for 13%. */
  vatPercent: number;
}

export interface PurchaseTotals {
  subtotal: number;
  discount: number;
  taxable: number;
  vatAmount: number;
  totalAmount: number;
}

/**
 * Purchase order totals:
 *   subtotal    = Σ(quantity × purchasePrice)
 *   taxable     = subtotal − discount
 *   vatAmount   = taxable × VAT% / 100
 *   totalAmount = taxable + vatAmount
 */
export function computePurchaseTotals(
  input: PurchaseTotalsInput,
): PurchaseTotals {
  const subtotal = roundCurrency(
    input.items.reduce(
      (sum, item) => sum + item.quantity * item.purchasePrice,
      0,
    ),
  );
  const discount = roundCurrency(input.discount);
  const taxable = roundCurrency(subtotal - discount);
  const vatAmount = roundCurrency((taxable * input.vatPercent) / 100);

  return {
    subtotal,
    discount,
    taxable,
    vatAmount,
    totalAmount: roundCurrency(taxable + vatAmount),
  };
}
