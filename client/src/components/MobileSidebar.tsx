import { NavLink } from "react-router";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { Menu } from "lucide-react";
import { sidebarItems as menuItems } from "@/features/dashboard/data/sidebar";

export default function MobileSidebar() {
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
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}

                to={item.href}

                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                    isActive
                      ? "bg-emerald-100 text-emerald-700"
                      : "hover:bg-muted"
                  } `
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
