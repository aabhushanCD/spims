import { LogOut } from "lucide-react";
import { Link } from "react-router";

import { sidebarItems } from "../../data/sidebar";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useAuth } from "@/features/auth/context/authContext";
import { filterNavigation, formatRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import Logo from "./Logo";
import SidebarItem from "./SidebarItem";

interface Props {
  collapsed?: boolean;
}

export default function Sidebar({ collapsed = false }: Props) {
  const logout = useLogout();
  const { currentUser } = useAuth();
  const filteredSidebarItem = filterNavigation(sidebarItems, currentUser?.role);
  const initial =
    currentUser?.name?.trim().charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "U";
  const displayName = currentUser?.name ?? "Signed in";
  const displayRole = formatRole(currentUser?.role);

  return (
    <aside
      id="app-sidebar"
      className={cn(
        "bg-sidebar text-sidebar-foreground hidden h-screen shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-20 shrink-0 items-center border-b",
          collapsed ? "justify-center px-3" : "px-6",
        )}
      >
        <Logo compact={collapsed} />
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
                collapsed={collapsed}
              />
            ))}
          </div>
        </nav>
      </ScrollArea>

      {/* User */}
      <div className="shrink-0 border-t p-4">
        {collapsed ? (
          <div className="flex flex-col items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/settings/security"
                  aria-label={`${displayName}, ${displayRole}`}
                  className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initial}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>

              <TooltipContent side="right">
                {displayName} · {displayRole}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout.mutate();
                  }}
                  disabled={logout.isPending}
                  aria-label="Logout"
                >
                  <LogOut size={18} aria-hidden="true" />
                </Button>
              </TooltipTrigger>

              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>

                <p className="text-muted-foreground truncate text-xs">
                  {displayRole}
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
          </>
        )}
      </div>
    </aside>
  );
}
