import NepaliDate from "nepali-date-converter";

import type {
  CalendarMode,
  Language,
} from "@/features/preferences/types/preferences.types";

export const DEFAULT_WORKSPACE_TIME_ZONE = "Asia/Kathmandu";

export type DateInput = string | number | Date;
export type DateKind = "date-only" | "instant";
export type DateDisplayStyle = "date" | "datetime";

export interface DateFormatConfig {
  timeZone: string;
  mode: CalendarMode;
  language: Language;
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface DateParts {
  primary: string;
  secondary?: string;
  full: string;
  iso: string;
  isBs: boolean;
  mode: "bs" | "ad" | "both";
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();
const adFormatterCache = new Map<string, Intl.DateTimeFormat>();

let defaultConfig: DateFormatConfig = {
  timeZone: DEFAULT_WORKSPACE_TIME_ZONE,
  mode: "ad",
  language: "en",
};

export function setDefaultDateFormatConfig(config: DateFormatConfig): void {
  defaultConfig = config;
}

export function getDefaultDateFormatConfig(): DateFormatConfig {
  return defaultConfig;
}

function getZonedFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = zonedFormatterCache.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    zonedFormatterCache.set(timeZone, formatter);
  }

  return formatter;
}

function getAdFormatter(
  timeZone: string,
  style: DateDisplayStyle,
): Intl.DateTimeFormat {
  const key = `${timeZone}:${style}`;
  let formatter = adFormatterCache.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(
      "en-GB",
      style === "datetime"
        ? {
            timeZone,
            dateStyle: "medium",
            timeStyle: "short",
          }
        : {
            timeZone,
            dateStyle: "medium",
          },
    );
    adFormatterCache.set(key, formatter);
  }

  return formatter;
}

export function isDateOnly(value: DateInput): boolean {
  return typeof value === "string" && DATE_ONLY_PATTERN.test(value);
}

function parseDateOnly(value: string): ZonedParts {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day, hour: 0, minute: 0, second: 0 };
}

function toDate(value: DateInput): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    const parts = parseDateOnly(value);
    return new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
    );
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getZonedParts(
  value: DateInput,
  timeZone: string,
): ZonedParts | null {
  if (isDateOnly(value)) {
    return parseDateOnly(value as string);
  }

  const date = toDate(value);
  if (!date) {
    return null;
  }

  const parts = getZonedFormatter(timeZone).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : 0;
  };

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second"),
  };
}

export function isNepalTimeZone(timeZone: string): boolean {
  if (timeZone === DEFAULT_WORKSPACE_TIME_ZONE) {
    return true;
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    }).formatToParts(new Date());
    const offset = parts.find(
      (part) => part.type === "timeZoneName",
    )?.value;

    return offset === "GMT+05:45";
  } catch {
    return false;
  }
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatAd(
  value: DateInput,
  parts: ZonedParts,
  timeZone: string,
  style: DateDisplayStyle,
): string {
  if (isDateOnly(value)) {
    const date = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
    );
    return getAdFormatter("UTC", style).format(date);
  }

  const date = toDate(value);
  if (!date) {
    return "—";
  }

  return getAdFormatter(timeZone, style).format(date);
}

function formatBs(
  parts: ZonedParts,
  language: Language,
  style: DateDisplayStyle,
): string | null {
  try {
    // Build the date from local calendar parts so the converter sees exactly
    // the workspace Y/M/D regardless of the machine's timezone.
    const adDate = new Date(
      parts.year,
      parts.month - 1,
      parts.day,
      12,
      0,
      0,
    );
    const bs = new NepaliDate(adDate);
    const date = bs.format(
      "YYYY MMMM D",
      language === "ne" ? "np" : "en",
    );

    if (style === "datetime") {
      return `${date}, ${pad(parts.hour)}:${pad(parts.minute)}`;
    }

    return date;
  } catch {
    return null;
  }
}

export function resolveEffectiveMode(
  mode: CalendarMode,
  timeZone: string,
): "bs" | "ad" | "both" {
  if (mode === "ad") {
    return "ad";
  }

  if (mode === "bs") {
    return "bs";
  }

  if (mode === "both") {
    return "both";
  }

  return isNepalTimeZone(timeZone) ? "both" : "ad";
}

export function formatDateParts(
  value: DateInput,
  config: DateFormatConfig,
  options: {
    kind?: DateKind;
    style?: DateDisplayStyle;
  } = {},
): DateParts {
  const kind = options.kind ?? (isDateOnly(value) ? "date-only" : "instant");
  const style = options.style ?? "date";
  const parts = getZonedParts(value, config.timeZone);
  const iso =
    kind === "date-only" && typeof value === "string"
      ? value
      : toDate(value)?.toISOString() ?? "";

  if (!parts) {
    return {
      primary: "—",
      full: "—",
      iso,
      isBs: false,
      mode: "ad",
    };
  }

  const ad = formatAd(value, parts, config.timeZone, style);
  const effectiveMode = resolveEffectiveMode(config.mode, config.timeZone);

  if (effectiveMode === "ad") {
    return { primary: ad, full: ad, iso, isBs: false, mode: "ad" };
  }

  const bs = formatBs(parts, config.language, style);

  if (!bs) {
    return { primary: ad, full: ad, iso, isBs: false, mode: "ad" };
  }

  return {
    primary: bs,
    secondary: ad,
    full: `${bs} · ${ad}`,
    iso,
    isBs: true,
    mode: effectiveMode,
  };
}

export function formatWorkspaceDate(
  value: DateInput,
  config: DateFormatConfig = defaultConfig,
  options: {
    kind?: DateKind;
    style?: DateDisplayStyle;
  } = {},
): string {
  return formatDateParts(value, config, options).full;
}

export function formatDate(
  value: DateInput,
  config: DateFormatConfig = defaultConfig,
): string {
  return formatWorkspaceDate(value, config, { style: "date" });
}

export function formatDateTime(
  value: DateInput,
  config: DateFormatConfig = defaultConfig,
): string {
  return formatWorkspaceDate(value, config, { style: "datetime" });
}

export function formatWeekday(
  value: DateInput,
  timeZone: string,
  language: Language,
): string {
  if (isDateOnly(value)) {
    const parts = parseDateOnly(value as string);
    const date = new Date(
      Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0),
    );
    return new Intl.DateTimeFormat(
      language === "ne" ? "ne-NP" : "en-GB",
      { weekday: "long", timeZone: "UTC" },
    ).format(date);
  }

  const date = toDate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat(
    language === "ne" ? "ne-NP" : "en-GB",
    { weekday: "long", timeZone },
  ).format(date);
}

export function formatWorkspaceTime(
  value: DateInput,
  timeZone: string,
): string {
  const date = toDate(value);
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function getWorkspaceHour(
  value: DateInput,
  timeZone: string,
): number {
  return getZonedParts(value, timeZone)?.hour ?? 0;
}

/**
 * Calendar-day number in the workspace timezone. Using UTC midnights avoids
 * DST-related partial-day arithmetic.
 */
export function getZonedDayNumber(
  parts: ZonedParts,
): number {
  return Math.floor(
    Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000,
  );
}
