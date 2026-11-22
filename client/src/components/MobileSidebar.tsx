import { NavLink } from "react-router";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { Menu } from "lucide-react";
import { sidebarItems as menuItems } from "@/features/dashboard/data/sidebar";
import { useAuth } from "@/features/auth/context/authContext";
import { filterNavigation } from "@/lib/permissions";
import { useState } from "react";

export default function MobileSidebar() {
  const { currentUser } = useAuth();
  const visibleItems = filterNavigation(menuItems, currentUser?.role);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (menuKey: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72">
        <h1 className="mb-6 text-xl font-bold text-emerald-600">SPIMS</h1>

        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if (item.children?.length) {
              return (
                <div key={item.title}>
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.title)}
                    className="hover:bg-muted flex w-full items-center justify-between rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      {item.title}
                    </div>
                  </button>

                  {openMenus[item.title] && (
                    <div className="mt-1 ml-8 space-y-1">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `block rounded-lg px-4 py-2 text-sm ${
                              isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "hover:bg-muted"
                            }`
                          }
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={item.path!}
                to={item.path!}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "hover:bg-muted"
                  }`
                }
              >
                <Icon size={20} />
                {item.title}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
