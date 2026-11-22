import { describe, expect, it } from "vitest";
import { LayoutDashboard, Users } from "lucide-react";

import { canAccess, filterNavigation, type NavItem } from "./permissions";

const items: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Settings",
    icon: Users,
    children: [
      { title: "Users", path: "/users", roles: ["owner", "pharmacist"] },
      { title: "Security", path: "/settings/security" },
    ],
  },
];

describe("canAccess", () => {
  it("allows every role when no roles are specified", () => {
    expect(canAccess("owner")).toBe(true);
    expect(canAccess(null)).toBe(true);
  });

  it("checks the role against the allowed list", () => {
    expect(canAccess("owner", ["owner"])).toBe(true);
    expect(canAccess("inventory_manager", ["owner"])).toBe(false);
    expect(canAccess(null, ["owner"])).toBe(false);
  });
});

describe("filterNavigation", () => {
  it("keeps unrestricted items", () => {
    const visible = filterNavigation(items, "inventory_manager");

    expect(visible.map((item) => item.title)).toEqual(["Dashboard", "Settings"]);
  });

  it("removes children the role cannot access", () => {
    const visible = filterNavigation(items, "inventory_manager");
    const settings = visible.find((item) => item.title === "Settings");

    expect(settings?.children?.map((child) => child.title)).toEqual([
      "Security",
    ]);
  });

  it("keeps user management for the roles the server allows", () => {
    for (const role of ["owner", "pharmacist"] as const) {
      const visible = filterNavigation(items, role);
      const settings = visible.find((item) => item.title === "Settings");

      expect(settings?.children?.map((child) => child.title)).toEqual([
        "Users",
        "Security",
      ]);
    }
  });

  it("drops a parent when every child is filtered out", () => {
    const onlyRestrictedChild: NavItem[] = [
      {
        title: "Admin",
        icon: Users,
        children: [{ title: "Users", path: "/users", roles: ["owner"] }],
      },
    ];

    expect(filterNavigation(onlyRestrictedChild, "pharmacist")).toEqual([]);
  });
});
