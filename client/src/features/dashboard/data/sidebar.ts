import {
  LayoutDashboard,
  Pill,
  Boxes,
  ShoppingCart,
  FileText,
  Settings,
  Database,
  DollarSign,
} from "lucide-react";

export const sidebarItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
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
    roles: ["pharmacist"],
    children: [
      {
        title: "Sales Orders",
        path: "/sales",
      },
    ],
  },

  {
    title: "Reports",
    icon: FileText,

    children: [
      {
        title: "Sales Report",
        path: "/reports/sales",
      },

      {
        title: "Inventory Report",
        path: "/reports/inventory",
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
      },

      {
        title: "Roles",
        path: "/roles",
      },
    ],
  },
];
