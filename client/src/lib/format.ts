const currencyFormatter = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return `Rs. ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString();
}

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString();
}

export function formatPercent(value: number): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
}
