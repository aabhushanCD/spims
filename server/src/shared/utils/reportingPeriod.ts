/**
 * Timezone-aware period helpers for reporting.
 *
 * Dates are persisted as UTC instants. Reporting periods (day/month/year
 * boundaries and month grouping) must use the configured business timezone so a
 * sale at 00:30 in Kathmandu does not fall into the previous UTC day.
 */

export interface ZonedDateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface DateRange {
  start: Date;
  endExclusive: Date;
}

export interface ZonedDateTimeInput {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
  millisecond?: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

/** Calendar parts of an instant in the given timezone. */
export function getZonedParts(
  date: Date,
  timeZone: string,
): ZonedDateTimeParts {
  const values: Record<string, number> = {};

  for (const part of getFormatter(timeZone).formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values["year"] ?? 0,
    month: values["month"] ?? 1,
    day: values["day"] ?? 1,
    hour: values["hour"] ?? 0,
    minute: values["minute"] ?? 0,
    second: values["second"] ?? 0,
  };
}

function getOffsetMs(date: Date, timeZone: string): number {
  const wholeSeconds = new Date(Math.floor(date.getTime() / 1000) * 1000);
  const parts = getZonedParts(wholeSeconds, timeZone);
  return (
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) - wholeSeconds.getTime()
  );
}

/** Converts calendar parts in a timezone to the corresponding UTC instant. */
export function zonedDateTimeToUtc(
  input: ZonedDateTimeInput,
  timeZone: string,
): Date {
  const {
    year,
    month,
    day,
    hour = 0,
    minute = 0,
    second = 0,
    millisecond = 0,
  } = input;

  const utcGuess = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );

  // Two passes handle the offset change around DST transitions.
  let offset = getOffsetMs(new Date(utcGuess), timeZone);
  let result = utcGuess - offset;
  const correctedOffset = getOffsetMs(new Date(result), timeZone);
  if (correctedOffset !== offset) {
    offset = correctedOffset;
    result = utcGuess - offset;
  }

  return new Date(result);
}

function assertValidYearMonth(year: number, month: number): void {
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new RangeError("year and month must be whole numbers");
  }
  if (month < 1 || month > 12) {
    throw new RangeError("month must be between 1 and 12");
  }
}

/** Half-open [start, endExclusive) range for a calendar month in a timezone. */
export function getMonthRange(
  year: number,
  month: number,
  timeZone: string,
): DateRange {
  assertValidYearMonth(year, month);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return {
    start: zonedDateTimeToUtc({ year, month, day: 1 }, timeZone),
    endExclusive: zonedDateTimeToUtc(
      { year: nextYear, month: nextMonth, day: 1 },
      timeZone,
    ),
  };
}

/** Half-open [start, endExclusive) range for a calendar year in a timezone. */
export function getYearRange(year: number, timeZone: string): DateRange {
  if (!Number.isInteger(year)) {
    throw new RangeError("year must be a whole number");
  }

  return {
    start: zonedDateTimeToUtc({ year, month: 1, day: 1 }, timeZone),
    endExclusive: zonedDateTimeToUtc(
      { year: year + 1, month: 1, day: 1 },
      timeZone,
    ),
  };
}

/** Current calendar month in the given timezone. */
export function getCurrentMonthRange(
  now: Date,
  timeZone: string,
): DateRange {
  const parts = getZonedParts(now, timeZone);
  return getMonthRange(parts.year, parts.month, timeZone);
}

/** Previous calendar month in the given timezone. */
export function getPreviousMonthRange(
  now: Date,
  timeZone: string,
): DateRange {
  const parts = getZonedParts(now, timeZone);
  const previousMonth = parts.month === 1 ? 12 : parts.month - 1;
  const previousYear = parts.month === 1 ? parts.year - 1 : parts.year;
  return getMonthRange(previousYear, previousMonth, timeZone);
}

/**
 * How many months of a given year have started, in the reporting timezone.
 * Past years return 12, the current year returns the current month number,
 * future years return 0.
 */
export function getElapsedMonthsInYear(
  year: number,
  now: Date,
  timeZone: string,
): number {
  const current = getZonedParts(now, timeZone);
  if (year < current.year) {
    return 12;
  }
  if (year > current.year) {
    return 0;
  }
  return current.month;
}
