import { describe, expect, it } from "vitest";

import {
  canAdministerNotifications,
  parseTemplateData,
} from "./notificationPayload";

describe("parseTemplateData", () => {
  it("parses an object of primitive values", () => {
    expect(parseTemplateData('{"name":"A","count":2,"ok":true}')).toEqual({
      data: { name: "A", count: 2, ok: true },
      error: null,
    });
  });

  it("treats blank input as empty data", () => {
    expect(parseTemplateData("  ")).toEqual({ data: {}, error: null });
  });

  it("rejects invalid JSON", () => {
    expect(parseTemplateData("{nope")).toEqual({
      data: null,
      error: "Template data must be valid JSON",
    });
  });

  it("rejects arrays and nested objects", () => {
    expect(parseTemplateData("[1,2]").data).toBeNull();
    expect(parseTemplateData('{"a":{"b":1}}').data).toBeNull();
  });
});

describe("canAdministerNotifications", () => {
  it("allows owner and pharmacist", () => {
    expect(canAdministerNotifications("owner")).toBe(true);
    expect(canAdministerNotifications("pharmacist")).toBe(true);
    expect(canAdministerNotifications("inventory_manager")).toBe(false);
  });
});
