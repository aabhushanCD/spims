import {
  formatDate,
  formatDateTime,
  getDefaultDateFormatConfig,
  setDefaultDateFormatConfig,
  type DateFormatConfig,
} from "./datetime/workspaceDate";

export { formatDate, formatDateTime };

/** Keeps plain formatter calls in sync with the active user preferences. */
export function configureDateFormatting(config: DateFormatConfig): void {
  setDefaultDateFormatConfig(config);
}

export function getDateFormattingConfig(): DateFormatConfig {
  return getDefaultDateFormatConfig();
}

const currencyFormatter = new Intl.NumberFormat("en-NP", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return `Rs. ${currencyFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatPercent(value: number): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
}

const COMPACT_CURRENCY_UNITS = [
  { threshold: 1_00_00_000, divisor: 1_00_00_000, suffix: "Cr" },
  { threshold: 1_00_000, divisor: 1_00_000, suffix: "L" },
  { threshold: 1_000, divisor: 1_000, suffix: "K" },
] as const;

/**
 * Short currency for cards and axes, using the Nepali lakh/crore scale:
 * `Rs. 1.2K`, `Rs. 3.5L`, `Rs. 1.2Cr`. Values below 1,000 keep the full
 * two-decimal format so small amounts stay exact.
 */
export function formatCompactCurrency(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const magnitude = Math.abs(amount);

  for (const unit of COMPACT_CURRENCY_UNITS) {
    if (magnitude >= unit.threshold) {
      const scaled = Math.round((magnitude / unit.divisor) * 10) / 10;
      const signed = amount < 0 ? -scaled : scaled;
      return `Rs. ${signed}${unit.suffix}`;
    }
  }

  return formatCurrency(amount);
}
