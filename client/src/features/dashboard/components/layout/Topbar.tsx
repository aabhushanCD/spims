import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import LanguageSwitcher from "@/features/preferences/components/LanguageSwitcher";
import { useDateFormat } from "@/lib/datetime/dateFormatContext";
import SidebarToggle from "./SidebarToggle";
import ThemeToggle from "./ThemeToggle";

interface Props {
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Topbar({ collapsed, onToggleSidebar }: Props) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const { weekday, format } = useDateFormat();
  const now = new Date();
  const weekdayLabel = weekday(now);
  const date = format(now, { style: "date" });
  const initial =
    currentUser?.name?.trim().charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    "U";

  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-20 items-center justify-between border-b px-6 backdrop-blur-md">
      {/* Left */}
      <div className="flex items-center gap-2">
        <SidebarToggle collapsed={collapsed} onToggle={onToggleSidebar} />
        <MobileSidebar />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden text-right lg:block">
          <p className="text-sm font-medium">{weekdayLabel}</p>

          <p className="text-muted-foreground text-xs">{date.primary}</p>

          {date.secondary ? (
            <p className="text-muted-foreground text-[11px]">
              {date.secondary}
            </p>
          ) : null}
        </div>

        <NotificationDropdown />

        <LanguageSwitcher />

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
                  {currentUser?.role
                    ? t(`role.${currentUser.role}`)
                    : t("common.unknown")}
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
              {t("topbar.profileSecurity")}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onSelect={() => logout.mutate()}
            >
              {t("topbar.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
