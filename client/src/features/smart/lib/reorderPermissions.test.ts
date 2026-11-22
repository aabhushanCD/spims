import { describe, expect, it } from "vitest";

import {
  canActOnRecommendation,
  canDeleteRecommendations,
  canManageRecommendations,
} from "./reorderPermissions";

describe("reorderPermissions", () => {
  it("allows owner and inventory manager to manage recommendations", () => {
    expect(canManageRecommendations("owner")).toBe(true);
    expect(canManageRecommendations("inventory_manager")).toBe(true);
    expect(canManageRecommendations("pharmacist")).toBe(false);
    expect(canManageRecommendations(null)).toBe(false);
  });

  it("allows only the owner to delete", () => {
    expect(canDeleteRecommendations("owner")).toBe(true);
    expect(canDeleteRecommendations("inventory_manager")).toBe(false);
    expect(canDeleteRecommendations("pharmacist")).toBe(false);
  });

  it("only allows actions on pending recommendations", () => {
    expect(canActOnRecommendation("owner", "PENDING")).toBe(true);
    expect(canActOnRecommendation("owner", "APPROVED")).toBe(false);
    expect(canActOnRecommendation("pharmacist", "PENDING")).toBe(false);
  });
});
