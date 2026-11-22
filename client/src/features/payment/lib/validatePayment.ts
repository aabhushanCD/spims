export function validatePaymentAmount(
  amount: number,
  amountDue: number,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "Enter a payment amount greater than zero";
  }

  if (amount > amountDue) {
    return "Payment cannot exceed the outstanding amount";
  }

  return null;
}
