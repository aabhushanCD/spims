import { Languages, CalendarDays, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import AppDate from "@/components/common/AppDate";
import RelativeTime from "@/components/common/RelativeTime";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePreferences } from "../context/preferencesContext";
import {
  CALENDAR_MODES,
  LANGUAGES,
  type CalendarMode,
  type Language,
} from "../types/preferences.types";

export default function PreferencesPage() {
  const { t } = useTranslation();
  const {
    language,
    calendarMode,
    timeZone,
    isSaving,
    setLanguage,
    setCalendarMode,
  } = usePreferences();

  const previewValue = new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("preferences.title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("preferences.subtitle")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-4 w-4" aria-hidden="true" />
            {t("preferences.language")}
          </CardTitle>
          <CardDescription>
            {t("preferences.languageHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="sr-only" htmlFor="preference-language">
            {t("preferences.language")}
          </label>
          <select
            id="preference-language"
            data-testid="preference-language"
            value={language}
            disabled={isSaving}
            onChange={(event) =>
              setLanguage(event.target.value as Language)
            }
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {LANGUAGES.map((option) => (
              <option key={option} value={option}>
                {t(`language.${option}`)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t("preferences.calendar")}
          </CardTitle>
          <CardDescription>
            {t("preferences.calendarHint")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="sr-only" htmlFor="preference-calendar">
            {t("preferences.calendar")}
          </label>
          <select
            id="preference-calendar"
            data-testid="preference-calendar"
            value={calendarMode}
            disabled={isSaving}
            onChange={(event) =>
              setCalendarMode(event.target.value as CalendarMode)
            }
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {CALENDAR_MODES.map((option) => (
              <option key={option} value={option}>
                {t(`calendarMode.${option}`)}
              </option>
            ))}
          </select>
          <p className="text-muted-foreground text-xs">
            {t(`calendarModeHint.${calendarMode}`)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            {t("preferences.timezone")}
          </CardTitle>
          <CardDescription>
            {t("preferences.timezoneHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="bg-muted rounded-md px-2 py-1 text-sm">
            {timeZone}
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("preferences.preview")}</CardTitle>
          <CardDescription>{t("preferences.previewHint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <AppDate value={previewValue} style="datetime" variant="detail" />
          <p className="text-muted-foreground">
            <RelativeTime value={previewValue} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
