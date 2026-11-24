import {
  LayoutDashboard,
  Bell,
  Boxes,
  ShoppingCart,
  Settings,
  Database,
  DollarSign,
  BarChart3,
} from "lucide-react";

import type { NavItem } from "@/lib/permissions";

/**
 * Titles are i18n keys. SidebarItem translates them at render time so the
 * navigation follows the active language without duplicating the tree.
 */
export const sidebarItems: NavItem[] = [
  {
    title: "nav.dashboard",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    title: "nav.reports",
    icon: BarChart3,
    path: "/reports",
  },

  {
    title: "nav.notifications",
    icon: Bell,
    path: "/notifications",
  },

  {
    title: "nav.inventory",
    icon: Boxes,

    children: [
      {
        title: "nav.medicines",
        path: "/medicines",
      },

      {
        title: "nav.batches",
        path: "/batches",
      },

      {
        title: "nav.stock",
        path: "/stock",
      },

      {
        title: "nav.movements",
        path: "/inventory/movements",
      },

      {
        title: "nav.reconciliation",
        path: "/inventory/reconciliation",
      },

      {
        title: "nav.stocktakes",
        path: "/stocktakes",
        roles: ["owner", "inventory_manager"],
      },

      {
        title: "nav.reorder",
        path: "/smart-reorders",
      },
    ],
  },

  {
    title: "nav.purchase",
    icon: ShoppingCart,

    children: [
      {
        title: "nav.purchaseOrders",
        path: "/purchase-orders",
      },

      {
        title: "nav.suppliers",
        path: "/suppliers",
      },

      {
        title: "nav.purchaseReturns",
        path: "/purchase-returns",
      },
    ],
  },

  {
    title: "nav.masterData",
    icon: Database,

    children: [
      {
        title: "nav.genericNames",
        path: "/generic-names",
      },

      {
        title: "nav.categories",
        path: "/categories",
      },

      {
        title: "nav.brands",
        path: "/brands",
      },

      {
        title: "nav.units",
        path: "/units",
      },
    ],
  },

  {
    title: "nav.sales",
    icon: DollarSign,
    children: [
      {
        title: "nav.salesOrders",
        path: "/sales",
      },

      {
        title: "nav.customers",
        path: "/customers",
      },

      {
        title: "nav.returns",
        path: "/returns",
      },
    ],
  },

  {
    title: "nav.settings",
    icon: Settings,

    children: [
      {
        title: "nav.users",
        path: "/users",
        // The server mounts /users for owner and pharmacist only.
        roles: ["owner", "pharmacist"],
      },

      {
        title: "nav.security",
        path: "/settings/security",
      },

      {
        title: "nav.preferences",
        path: "/settings/preferences",
      },

      {
        title: "nav.notifications",
        path: "/settings/notifications",
      },

      {
        title: "nav.notificationAdmin",
        path: "/notifications/admin",
        roles: ["owner", "pharmacist"],
      },

      {
        title: "nav.templates",
        path: "/notification-templates",
      },

      {
        title: "nav.auditLog",
        path: "/audit",
        roles: ["owner"],
      },
    ],
  },
];
