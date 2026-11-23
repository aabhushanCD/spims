import type { LucideIcon } from "lucide-react";

export type Role = "owner" | "inventory_manager" | "pharmacist";

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  inventory_manager: "Inventory manager",
  pharmacist: "Pharmacist",
};

/** Human-readable role label for menus and account summaries. */
export function formatRole(role: Role | null | undefined): string {
  return role ? ROLE_LABELS[role] : "Unknown";
}

export interface NavChild {
  title: string;
  path: string;
  roles?: readonly Role[];
}

export interface NavItem {
  title: string;
  icon: LucideIcon;
  path?: string;
  roles?: readonly Role[];
  children?: NavChild[];
}

/**
 * A capability open to every authenticated role has no `roles` entry.
 */
export function canAccess(
  role: Role | null | undefined,
  roles?: readonly Role[],
): boolean {
  if (!roles || roles.length === 0) {
    return true;
  }

  return Boolean(role && roles.includes(role));
}

/**
 * Removes items and children the role cannot access, and drops a parent
 * whose children are all filtered out.
 */
export function filterNavigation(
  items: readonly NavItem[],
  role: Role | null | undefined,
): NavItem[] {
  return items.reduce<NavItem[]>((visible, item) => {
    if (!canAccess(role, item.roles)) {
      return visible;
    }

    if (!item.children) {
      visible.push(item);
      return visible;
    }

    const children = item.children.filter((child) =>
      canAccess(role, child.roles),
    );

    if (children.length > 0) {
      visible.push({ ...item, children });
    }

    return visible;
  }, []);
}
