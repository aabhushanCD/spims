import {
  LayoutDashboard,
  Pill,
  Boxes,
  Truck,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { NavLink } from "react-router";

import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    title: "Medicines",
    icon: Pill,
    path: "/medicines",
  },
  {
    title: "Inventory",
    icon: Boxes,
    path: "/inventory",
  },
  {
    title: "Suppliers",
    icon: Truck,
    path: "/suppliers",
  },
  {
    title: "Purchases",
    icon: ShoppingCart,
    path: "/purchases",
  },
  {
    title: "Sales",
    icon: Receipt,
    path: "/sales",
  },
  {
    title: "Reports",
    icon: BarChart3,
    path: "/reports",
  },
  {
    title: "Users",
    icon: Users,
    path: "/users",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="bg-background flex h-screen w-72 flex-col border-r">
      {/* Logo */}

      <div className="flex h-20 items-center gap-3 px-6">
        <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold">
          S
        </div>

        <div>
          <h1 className="text-lg font-bold">SPIMS</h1>

          <p className="text-muted-foreground text-xs">Smart Pharmacy</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}

      <nav className="flex-1 space-y-1 px-4 py-5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } `
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={20} />

                <span>{item.title}</span>
              </div>

              <ChevronRight size={16} />
            </NavLink>
          );
        })}
      </nav>

      <Separator />

      {/* User Section */}

      <div className="p-4">
        <div className="bg-muted mb-3 rounded-xl p-3">
          <p className="text-sm font-medium">Admin User</p>

          <p className="text-muted-foreground text-xs">admin@spims.com</p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600"
          onClick={() => {
            
            // Handle logout logic here
          }
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </aside>
  );
}
