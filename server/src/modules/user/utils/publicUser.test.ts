import { describe, expect, it } from "vitest";

import {
  DEFAULT_USER_PREFERENCES,
  normalizeUserPreferences,
} from "../types/preferences.ts";
import { toPublicUser, type UserLike } from "./publicUser.ts";

function buildUser(overrides: Partial<UserLike> = {}): UserLike {
  return {
    _id: "user-1",
    name: "Asha Sharma",
    email: "asha@example.com",
    role: "pharmacist",
    isActive: true,
    provider: "local",
    lastLogin: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("toPublicUser preferences", () => {
  it("defaults preferences when legacy documents do not have them", () => {
    const user = toPublicUser(buildUser());

    expect(user.preferences).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("normalizes partial preferences", () => {
    const user = toPublicUser(
      buildUser({ preferences: { language: "ne" } }),
    );

    expect(user.preferences).toEqual({
      language: "ne",
      calendarMode: "auto",
    });
  });

  it("keeps valid stored preferences", () => {
    const user = toPublicUser(
      buildUser({
        preferences: { language: "ne", calendarMode: "both" },
      }),
    );

    expect(user.preferences).toEqual({
      language: "ne",
      calendarMode: "both",
    });
  });

  it("falls back for unexpected stored values", () => {
    expect(
      normalizeUserPreferences({
        language: "fr" as never,
        calendarMode: "lunar" as never,
      }),
    ).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it("never exposes authentication secrets", () => {
    const user = toPublicUser(buildUser());

    expect(user).not.toHaveProperty("password");
    expect(user).not.toHaveProperty("refreshToken");
    expect(user).not.toHaveProperty("emailVerificationTokenHash");
  });
});
