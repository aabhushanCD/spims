/**
 * User-facing localization preferences.
 *
 * These values are persisted per user so a language/calendar choice follows the
 * account across devices. The workspace timezone itself is not user-editable;
 * it comes from the server reporting configuration.
 */

export const LANGUAGES = ["en", "ne"] as const;
export const CALENDAR_MODES = ["auto", "bs", "ad", "both"] as const;

export type Language = (typeof LANGUAGES)[number];
export type CalendarMode = (typeof CALENDAR_MODES)[number];

export interface UserPreferences {
  language: Language;
  calendarMode: CalendarMode;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: "en",
  calendarMode: "auto",
};

function isLanguage(value: unknown): value is Language {
  return (
    typeof value === "string" && (LANGUAGES as readonly string[]).includes(value)
  );
}

function isCalendarMode(value: unknown): value is CalendarMode {
  return (
    typeof value === "string" &&
    (CALENDAR_MODES as readonly string[]).includes(value)
  );
}

/**
 * Normalizes persisted or partial preference data. Older documents do not have
 * the `preferences` path, and `.lean()` reads bypass Mongoose defaults, so every
 * public user response goes through this function.
 */
export function normalizeUserPreferences(
  preferences?: Partial<UserPreferences> | null,
): UserPreferences {
  return {
    language: isLanguage(preferences?.language)
      ? preferences.language
      : DEFAULT_USER_PREFERENCES.language,
    calendarMode: isCalendarMode(preferences?.calendarMode)
      ? preferences.calendarMode
      : DEFAULT_USER_PREFERENCES.calendarMode,
  };
}
