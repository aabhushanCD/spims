import { describe, expect, it } from "vitest";

import { getFirstName, getGreeting } from "./greeting";

describe("getGreeting", () => {
  it("uses the expected bucket for each part of the day", () => {
    expect(getGreeting(0)).toBe("Good night");
    expect(getGreeting(4)).toBe("Good night");
    expect(getGreeting(5)).toBe("Good morning");
    expect(getGreeting(11)).toBe("Good morning");
    expect(getGreeting(12)).toBe("Good afternoon");
    expect(getGreeting(16)).toBe("Good afternoon");
    expect(getGreeting(17)).toBe("Good evening");
    expect(getGreeting(20)).toBe("Good evening");
    expect(getGreeting(21)).toBe("Good night");
    expect(getGreeting(23)).toBe("Good night");
  });
});

describe("getFirstName", () => {
  it("returns the first word of a full name", () => {
    expect(getFirstName("Asha Sharma")).toBe("Asha");
    expect(getFirstName("  Asha   Sharma  ")).toBe("Asha");
    expect(getFirstName("Asha")).toBe("Asha");
  });

  it("falls back when the name is missing or blank", () => {
    expect(getFirstName(undefined)).toBe("there");
    expect(getFirstName(null)).toBe("there");
    expect(getFirstName("   ")).toBe("there");
  });
});
