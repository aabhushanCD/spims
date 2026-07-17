
import { LogOut } from "lucide-react";

import { sidebarItems } from "../../data/sidebar";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SidebarItem from "@/components/dashboard/SidebarItem";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useAuth } from "@/features/auth/context/authContext";

export default function Sidebar() {
  const logout = useLogout();
  const { theme } = useAuth();
  return (
    <aside className={`bg-background hidden h-screen w-72 shrink-0 border-r lg:block ${theme === "dark" ? "dark text-white " : ""}`}>
      {/* Logo */}

      <div className="flex h-20 items-center gap-3 border-b px-6 py-5">
        <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold">
          💊
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight">SPIMS</h1>

          <p className="text-muted-foreground text-xs">Smart Pharmacy</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-5">
        <div className="space-y-1">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.title}
              title={item.title}
              icon={item.icon}
              path={item.path}
              children={item.children}
            />
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* User */}
      <div className="space-y-5 p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => {
            logout.mutate();
          }}
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>
    </aside>
  );
}
