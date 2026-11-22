import {
  LayoutDashboard,
  Bell,
  Boxes,
  ShoppingCart,
  Settings,
  Database,
  DollarSign,
} from "lucide-react";

import type { NavItem } from "@/lib/permissions";

export const sidebarItems: NavItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },

  {
    title: "Notifications",
    icon: Bell,
    path: "/notifications",
  },

  {
    title: "Inventory",
    icon: Boxes,

    children: [
      {
        title: "Medicines",
        path: "/medicines",
      },

      {
        title: "Batches",
        path: "/batches",
      },

      {
        title: "Stock",
        path: "/stock",
      },

      {
        title: "Movements",
        path: "/inventory/movements",
      },

      {
        title: "Reconciliation",
        path: "/inventory/reconciliation",
      },

      {
        title: "Stocktakes",
        path: "/stocktakes",
        roles: ["owner", "inventory_manager"],
      },
    ],
  },

  {
    title: "Purchase",
    icon: ShoppingCart,

    children: [
      {
        title: "Purchase Orders",
        path: "/purchase-orders",
      },

      {
        title: "Suppliers",
        path: "/suppliers",
      },

      {
        title: "Purchase Returns",
        path: "/purchase-returns",
      },
    ],
  },

  {
    title: "Master Data",
    icon: Database,

    children: [
      {
        title: "Generic Names",
        path: "/generic-names",
      },

      {
        title: "Categories",
        path: "/categories",
      },

      {
        title: "Brands",
        path: "/brands",
      },

      {
        title: "Units",
        path: "/units",
      },
    ],
  },

  {
    title: "Sales",
    icon: DollarSign,
    children: [
      {
        title: "Sales Orders",
        path: "/sales",
      },

      {
        title: "Customers",
        path: "/customers",
      },

      {
        title: "Returns",
        path: "/returns",
      },
    ],
  },

  {
    title: "Settings",
    icon: Settings,

    children: [
      {
        title: "Users",
        path: "/users",
        // The server mounts /users for owner and pharmacist only.
        roles: ["owner", "pharmacist"],
      },

      {
        title: "Security",
        path: "/settings/security",
      },

      {
        title: "Notifications",
        path: "/settings/notifications",
      },
    ],
  },
];
