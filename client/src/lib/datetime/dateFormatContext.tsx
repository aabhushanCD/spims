/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type ReactNode } from "react";

import type {
  CalendarMode,
  Language,
} from "@/features/preferences/types/preferences.types";
import {
  DEFAULT_WORKSPACE_TIME_ZONE,
  formatDateParts,
  formatWeekday,
  formatWorkspaceDate,
  formatWorkspaceTime,
  getWorkspaceHour,
  setDefaultDateFormatConfig,
  type DateDisplayStyle,
  type DateInput,
  type DateKind,
  type DateParts,
} from "./workspaceDate";
import {
  formatRelativeTime,
  type RelativeTimeOptions,
  type RelativeTimeResult,
} from "./relativeTime";

export interface DateFormatContextValue {
  timeZone: string;
  mode: CalendarMode;
  language: Language;
  format: (
    value: DateInput,
    options?: { kind?: DateKind; style?: DateDisplayStyle },
  ) => DateParts;
  formatString: (
    value: DateInput,
    options?: { kind?: DateKind; style?: DateDisplayStyle },
  ) => string;
  relative: (
    value: DateInput,
    options?: Omit<RelativeTimeOptions, "timeZone" | "language">,
  ) => RelativeTimeResult;
  weekday: (value: DateInput) => string;
  time: (value: DateInput) => string;
  hour: (value: DateInput) => number;
}

function createContextValue(
  timeZone: string,
  mode: CalendarMode,
  language: Language,
): DateFormatContextValue {
  const config = { timeZone, mode, language };

  return {
    timeZone,
    mode,
    language,
    format: (value, options) => formatDateParts(value, config, options),
    formatString: (value, options) =>
      formatWorkspaceDate(value, config, options),
    relative: (value, options) =>
      formatRelativeTime(value, { timeZone, language, ...options }),
    weekday: (value) => formatWeekday(value, timeZone, language),
    time: (value) => formatWorkspaceTime(value, timeZone),
    hour: (value) => getWorkspaceHour(value, timeZone),
  };
}

const DateFormatContext = createContext<DateFormatContextValue>(
  createContextValue(DEFAULT_WORKSPACE_TIME_ZONE, "ad", "en"),
);

interface DateFormatProviderProps {
  timeZone?: string;
  mode?: CalendarMode;
  language?: Language;
  children: ReactNode;
}

export function DateFormatProvider({
  timeZone = DEFAULT_WORKSPACE_TIME_ZONE,
  mode = "ad",
  language = "en",
  children,
}: DateFormatProviderProps) {
  // Keep the non-hook formatters used by legacy call sites in sync. Components
  // re-render when this provider re-renders because they are descendants.
  setDefaultDateFormatConfig({ timeZone, mode, language });

  const value = useMemo(
    () => createContextValue(timeZone, mode, language),
    [timeZone, mode, language],
  );

  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormat(): DateFormatContextValue {
  return useContext(DateFormatContext);
}
