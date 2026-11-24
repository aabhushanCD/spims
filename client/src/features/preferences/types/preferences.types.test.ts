import { describe, expect, it } from "vitest";

import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
} from "./preferences.types";

describe("user preferences", () => {
  it("defaults missing preferences", () => {
    expect(normalizeUserPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
    expect(normalizeUserPreferences(null)).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("fills one missing field with its default", () => {
    expect(normalizeUserPreferences({ language: "ne" })).toEqual({
      language: "ne",
      calendarMode: "auto",
    });
  });

  it("keeps valid stored values", () => {
    expect(
      normalizeUserPreferences({ language: "ne", calendarMode: "both" }),
    ).toEqual({ language: "ne", calendarMode: "both" });
  });

  it("rejects unexpected values", () => {
    expect(
      normalizeUserPreferences({
        language: "fr" as never,
        calendarMode: "lunar" as never,
      }),
    ).toEqual(DEFAULT_USER_PREFERENCES);
  });
});
