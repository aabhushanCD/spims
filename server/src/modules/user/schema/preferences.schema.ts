import { z } from "zod";

import { CALENDAR_MODES, LANGUAGES } from "../types/preferences.ts";

export const languageSchema = z.enum(LANGUAGES);
export const calendarModeSchema = z.enum(CALENDAR_MODES);

/**
 * Self-service preference update. Both fields are optional, but an empty body
 * is rejected so a stray PATCH cannot produce a meaningless write.
 */
export const updatePreferencesSchema = z
  .object({
    language: languageSchema.optional(),
    calendarMode: calendarModeSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.language !== undefined || value.calendarMode !== undefined,
    { message: "At least one preference must be provided" },
  );

export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
