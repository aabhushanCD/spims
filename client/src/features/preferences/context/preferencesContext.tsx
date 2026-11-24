/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useAuth } from "@/features/auth/context/authContext";
import { useWorkspaceConfig } from "@/features/config/hooks/useWorkspaceConfig";
import { DateFormatProvider } from "@/lib/datetime/dateFormatContext";
import { NowProvider } from "@/lib/datetime/nowContext";
import {
  DEFAULT_WORKSPACE_TIME_ZONE,
} from "@/lib/datetime/workspaceDate";
import { i18n, LANGUAGE_STORAGE_KEY } from "@/lib/i18n";
import {
  normalizeUserPreferences,
  type CalendarMode,
  type Language,
} from "../types/preferences.types";
import { useUpdatePreferences } from "../hooks/useUpdatePreferences";

interface PreferencesContextValue {
  language: Language;
  calendarMode: CalendarMode;
  timeZone: string;
  isSaving: boolean;
  setLanguage: (language: Language) => void;
  setCalendarMode: (mode: CalendarMode) => void;
}

function readStoredLanguage(): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "en" || stored === "ne" ? stored : null;
}

const defaultValue: PreferencesContextValue = {
  language: "en",
  calendarMode: "auto",
  timeZone: DEFAULT_WORKSPACE_TIME_ZONE,
  isSaving: false,
  setLanguage: () => undefined,
  setCalendarMode: () => undefined,
};

const PreferencesContext =
  createContext<PreferencesContextValue>(defaultValue);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { data: config } = useWorkspaceConfig();
  const updatePreferences = useUpdatePreferences();

  const [override, setOverride] = useState<{
    userId?: string;
    language?: Language;
    calendarMode?: CalendarMode;
  }>({});

  const userId = currentUser?._id;
  const serverPreferences = normalizeUserPreferences(currentUser?.preferences);
  const storedLanguage = readStoredLanguage();
  // Overrides are scoped to the user they were made for, so logging in as a
  // different account starts from that account's server preference without an
  // effect that resets state after render.
  const activeOverride = override.userId === userId ? override : {};

  const language =
    activeOverride.language ??
    (currentUser ? serverPreferences.language : storedLanguage ?? "en");
  const calendarMode =
    activeOverride.calendarMode ?? serverPreferences.calendarMode;
  const timeZone =
    config?.reportingTimeZone || DEFAULT_WORKSPACE_TIME_ZONE;

  useEffect(() => {
    void i18n.changeLanguage(language);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback(
    (next: Language) => {
      if (next === language) {
        return;
      }

      const previous = language;
      setOverride((current) => ({ ...current, userId, language: next }));

      if (!currentUser) {
        return;
      }

      updatePreferences.mutate(
        { language: next },
        {
          onError: () => {
            setOverride((current) => ({
              ...current,
              userId,
              language: previous,
            }));
            toast.error(t("preferences.saveFailed"));
          },
        },
      );
    },
    [language, t, updatePreferences, userId, currentUser],
  );

  const setCalendarMode = useCallback(
    (next: CalendarMode) => {
      if (next === calendarMode) {
        return;
      }

      const previous = calendarMode;
      setOverride((current) => ({
        ...current,
        userId,
        calendarMode: next,
      }));

      if (!currentUser) {
        return;
      }

      updatePreferences.mutate(
        { calendarMode: next },
        {
          onError: () => {
            setOverride((current) => ({
              ...current,
              userId,
              calendarMode: previous,
            }));
            toast.error(t("preferences.saveFailed"));
          },
        },
      );
    },
    [calendarMode, t, updatePreferences, userId, currentUser],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      language,
      calendarMode,
      timeZone,
      isSaving: updatePreferences.isPending,
      setLanguage,
      setCalendarMode,
    }),
    [
      language,
      calendarMode,
      timeZone,
      updatePreferences.isPending,
      setLanguage,
      setCalendarMode,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>
      <DateFormatProvider
        timeZone={timeZone}
        mode={calendarMode}
        language={language}
      >
        <NowProvider>{children}</NowProvider>
      </DateFormatProvider>
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  return useContext(PreferencesContext);
}
