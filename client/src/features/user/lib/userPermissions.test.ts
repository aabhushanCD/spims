import { describe, expect, it } from "vitest";

import { canActOnUser, canManageUsers } from "./userPermissions";

describe("userPermissions", () => {
  it("allows only owners to manage users", () => {
    expect(canManageUsers("owner")).toBe(true);
    expect(canManageUsers("pharmacist")).toBe(false);
    expect(canManageUsers("inventory_manager")).toBe(false);
    expect(canManageUsers(null)).toBe(false);
  });

  it("blocks actions against the signed-in user", () => {
    expect(canActOnUser("user-1", "user-2")).toBe(true);
    expect(canActOnUser("user-1", "user-1")).toBe(false);
    expect(canActOnUser(undefined, "user-1")).toBe(false);
  });
});
