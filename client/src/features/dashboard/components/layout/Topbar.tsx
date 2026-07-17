import { format } from "date-fns";
import { ChevronDown, Moon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/components/dashboard/NotificationDropdown";
import MobileSidebar from "@/components/MobileSidebar";
import { useAuth } from "@/features/auth/context/authContext";

export default function Topbar() {
  const { currentUser, toggleTheme, theme } = useAuth();
  return (
    <header className={`bg-background/80 sticky top-0 z-40 flex h-20 items-center justify-between border-b px-6 backdrop-blur-md ${theme === "dark" ? "gray text-white " : ""}`}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <MobileSidebar />

        <div className="hidden md:flex md:w-96">
          <div className="relative w-full">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />

            <Input
              placeholder="Search medicines, suppliers..."
              className="pl-10"
            />
          </div>
        </div>
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

          

        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          <Moon className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {currentUser?.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="hidden text-left md:block">
                <p className="text-sm font-medium">{currentUser?.name}</p>

                <p className="text-muted-foreground text-xs">
                  {currentUser?.role}
                </p>
              </div>

              <ChevronDown className="hidden h-4 w-4 md:block" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>Profile</DropdownMenuItem>

            <DropdownMenuItem>Account Settings</DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
