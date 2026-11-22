import type { CsvExportType } from "@/features/dashboard/types/dashboard";

function toInputDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultReportRange(now = new Date()): {
  from: string;
  to: string;
} {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toInputDate(start), to: toInputDate(now) };
}

/**
 * The dashboard range endpoints use `[from, to)` bounds. Send the start of the
 * selected `from` day and the start of the day after `to`, so both complete
 * local days are included without an end-of-day millisecond gap.
 */
export function buildReportRangeParams(
  fromDate: string,
  toDate: string,
): { from: string; to: string } {
  const from = new Date(`${fromDate}T00:00:00`);
  const toInclusive = new Date(`${toDate}T00:00:00`);

  if (
    Number.isNaN(from.getTime()) ||
    Number.isNaN(toInclusive.getTime()) ||
    from > toInclusive
  ) {
    throw new Error("Choose a valid date range");
  }

  const toExclusive = new Date(toInclusive);
  toExclusive.setDate(toExclusive.getDate() + 1);

  return { from: from.toISOString(), to: toExclusive.toISOString() };
}

export function csvFilename(
  type: CsvExportType,
  from?: string,
  to?: string,
): string {
  if (type === "inventory" || !from || !to) {
    return `${type}-snapshot.csv`;
  }

  return `${type}-${from}-${to}.csv`;
}
