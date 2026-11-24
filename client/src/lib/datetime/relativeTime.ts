import type { Language } from "@/features/preferences/types/preferences.types";
import {
  formatWorkspaceDate,
  getZonedDayNumber,
  getZonedParts,
  isDateOnly,
  type DateInput,
} from "./workspaceDate";

export interface RelativeTimeOptions {
  timeZone: string;
  language: Language;
  now?: Date;
  style?: "long" | "short" | "narrow";
  maxRelativeDays?: number;
  justNow?: string;
}

export interface RelativeTimeResult {
  text: string;
  isRelative: boolean;
  iso: string;
  absolute: string;
}

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function localeFor(language: Language): string {
  return language === "ne" ? "ne-NP" : "en";
}

export function formatRelativeTime(
  value: DateInput,
  options: RelativeTimeOptions,
): RelativeTimeResult {
  const date = toDate(value);
  const absolute = formatWorkspaceDate(value, {
    timeZone: options.timeZone,
    mode: "both",
    language: options.language,
  }, { style: "datetime" });

  if (!date || isDateOnly(value)) {
    return {
      text: absolute,
      isRelative: false,
      iso: typeof value === "string" ? value : "",
      absolute,
    };
  }

  const now = options.now ?? new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);
  const justNow = options.justNow ?? "just now";
  const formatter = new Intl.RelativeTimeFormat(localeFor(options.language), {
    numeric: "auto",
    style: options.style ?? "long",
  });
  const iso = date.toISOString();

  if (absMs < 45_000) {
    return { text: justNow, isRelative: true, iso, absolute };
  }

  if (absMs < HOUR_MS) {
    return {
      text: formatter.format(Math.round(diffMs / MINUTE_MS), "minute"),
      isRelative: true,
      iso,
      absolute,
    };
  }

  if (absMs < DAY_MS) {
    return {
      text: formatter.format(Math.round(diffMs / HOUR_MS), "hour"),
      isRelative: true,
      iso,
      absolute,
    };
  }

  const nowParts = getZonedParts(now, options.timeZone);
  const dateParts = getZonedParts(date, options.timeZone);

  if (!nowParts || !dateParts) {
    return { text: absolute, isRelative: false, iso, absolute };
  }

  const dayDiff =
    getZonedDayNumber(dateParts) - getZonedDayNumber(nowParts);
  const maxRelativeDays = options.maxRelativeDays ?? 7;

  if (Math.abs(dayDiff) <= maxRelativeDays) {
    return {
      text:
        dayDiff === 0
          ? formatter.format(Math.round(diffMs / HOUR_MS), "hour")
          : formatter.format(dayDiff, "day"),
      isRelative: true,
      iso,
      absolute,
    };
  }

  return { text: absolute, isRelative: false, iso, absolute };
}
