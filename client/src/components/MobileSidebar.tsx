import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

import { Menu } from "lucide-react";
import { sidebarItems as menuItems } from "@/features/dashboard/data/sidebar";
import { useAuth } from "@/features/auth/context/authContext";
import { filterNavigation } from "@/lib/permissions";
import Logo from "@/features/dashboard/components/layout/Logo";
import SidebarItem from "@/features/dashboard/components/layout/SidebarItem";

export default function MobileSidebar() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const visibleItems = useMemo(
    () => filterNavigation(menuItems, currentUser?.role),
    [currentUser?.role],
  );
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("nav.mainNavigation")}
        >
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 gap-0 p-0">
        <SheetHeader className="flex h-20 shrink-0 flex-row items-center gap-0 border-b px-6">
          <Logo />
          <SheetTitle className="sr-only">
            {t("nav.mainNavigation")}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("nav.browseModules")}
          </SheetDescription>
        </SheetHeader>

        <nav
          aria-label={t("nav.mainNavigation")}
          className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
        >
          <div className="space-y-1">
            {visibleItems.map((item) => (
              <SidebarItem
                key={item.title}
                title={item.title}
                icon={item.icon}
                path={item.path}
                children={item.children}
                onNavigate={() => setOpen(false)}
              />
            ))}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
