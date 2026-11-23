import { LogOut } from "lucide-react";

import { sidebarItems } from "../../data/sidebar";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useAuth } from "@/features/auth/context/authContext";
import { filterNavigation, formatRole } from "@/lib/permissions";
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";

export default function Sidebar() {
  const logout = useLogout();
  const { currentUser } = useAuth();
  const filteredSidebarItem = filterNavigation(sidebarItems, currentUser?.role);
  const initial =
    currentUser?.name?.trim().charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden h-screen w-72 shrink-0 flex-col border-r lg:flex">
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center border-b px-6">
        <Logo />
      </div>

      {/* Navigation */}
      <ScrollArea className="min-h-0 flex-1 px-3 py-5">
        <nav aria-label="Main navigation">
          <div className="space-y-1">
            {filteredSidebarItem.map((item) => (
              <SidebarItem
                key={item.title}
                title={item.title}
                icon={item.icon}
                path={item.path}
                children={item.children}
              />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="shrink-0 border-t p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {currentUser?.name ?? "Signed in"}
            </p>

            <p className="text-muted-foreground truncate text-xs">
              {formatRole(currentUser?.role)}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            logout.mutate();
          }}
          disabled={logout.isPending}
        >
          <LogOut size={18} aria-hidden="true" />
          {logout.isPending ? "Signing out..." : "Logout"}
        </Button>
      </div>
    </aside>
  );
}
