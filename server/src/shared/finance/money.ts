/**
 * Shared money helpers.
 *
 * All persisted monetary values are rounded to two decimal places at the point
 * they are stored. Keeping the rounding here prevents sales, returns, and
 * purchases from drifting apart with slightly different formulas.
 */

/** Nepal standard VAT percentage. Stored as a percentage (13 = 13%). */
export const VAT_PERCENT = 13;

/** VAT as a decimal rate (0.13). */
export const VAT_RATE = VAT_PERCENT / 100;

/**
 * Rounds an amount to two decimal places, symmetrically for negative values.
 */
export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round((Math.abs(value) + Number.EPSILON) * 100)) / 100;
}

/** VAT amount for a net (VAT-exclusive) value. */
export function calculateVat(
  netAmount: number,
  rate: number = VAT_RATE,
): number {
  return roundCurrency(netAmount * rate);
}

/** Splits a net amount into net, VAT, and gross components. */
export function addVat(
  netAmount: number,
  rate: number = VAT_RATE,
): { net: number; vat: number; gross: number } {
  const net = roundCurrency(netAmount);
  const vat = calculateVat(net, rate);
  return { net, vat, gross: roundCurrency(net + vat) };
}
