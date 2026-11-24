import { describe, expect, it } from "vitest";

import { updatePreferencesSchema } from "./preferences.schema.ts";

describe("updatePreferencesSchema", () => {
  it("accepts a language on its own", () => {
    expect(updatePreferencesSchema.parse({ language: "ne" })).toEqual({
      language: "ne",
    });
  });

  it("accepts a calendar mode on its own", () => {
    expect(
      updatePreferencesSchema.parse({ calendarMode: "bs" }),
    ).toEqual({ calendarMode: "bs" });
  });

  it("accepts both values together", () => {
    expect(
      updatePreferencesSchema.parse({
        language: "ne",
        calendarMode: "both",
      }),
    ).toEqual({ language: "ne", calendarMode: "both" });
  });

  it("rejects an empty body", () => {
    expect(() => updatePreferencesSchema.parse({})).toThrow(
      /At least one preference/,
    );
  });

  it("rejects unsupported languages and calendars", () => {
    expect(() =>
      updatePreferencesSchema.parse({ language: "fr" }),
    ).toThrow();
    expect(() =>
      updatePreferencesSchema.parse({ calendarMode: "lunar" }),
    ).toThrow();
  });

  it("rejects unknown keys", () => {
    expect(() =>
      updatePreferencesSchema.parse({ timezone: "UTC" }),
    ).toThrow();
  });
});
