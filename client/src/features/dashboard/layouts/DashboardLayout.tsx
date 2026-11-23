import { Outlet } from "react-router";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useNotificationSocket } from "@/features/notification/hooks/useNotificationSocket";
import { useSidebarCollapsed } from "../hooks/useSidebarCollapsed";

export default function DashboardLayout() {
  const { collapsed, toggle } = useSidebarCollapsed();
  useNotificationSocket();

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Fixed Sidebar */}
        <Sidebar collapsed={collapsed} />

        {/* Right Content Area */}
        <div className="dark:bg-background flex min-w-0 flex-1 flex-col">
          {/* Fixed Topbar */}
          <Topbar collapsed={collapsed} onToggleSidebar={toggle} />

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
