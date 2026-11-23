import { format } from "date-fns";
import { ChevronDown } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/features/notification/components/NotificationDropdown";
import MobileSidebar from "@/components/MobileSidebar";
import { useAuth } from "@/features/auth/context/authContext";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useNavigate } from "react-router";
import { formatRole } from "@/lib/permissions";
import ThemeToggle from "./ThemeToggle";

export default function Topbar() {
  const { currentUser } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const initial =
    currentUser?.name?.trim().charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-20 items-center justify-between border-b px-6 backdrop-blur-md">
      {/* Left */}
      <div className="flex items-center gap-4">
        <MobileSidebar />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden text-right lg:block">
          <p className="text-sm font-medium">{format(new Date(), "EEEE")}</p>

          <p className="text-muted-foreground text-xs">
            {format(new Date(), "dd MMM yyyy")}
          </p>
        </div>

        <NotificationDropdown />

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>

              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{currentUser?.name}</p>

                <p className="text-muted-foreground text-xs">
                  {formatRole(currentUser?.role)}
                </p>
              </div>

              <ChevronDown
                className="hidden h-4 w-4 md:block"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onSelect={() => navigate("/settings/security")}
            >
              Profile &amp; security
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onSelect={() => logout.mutate()}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
