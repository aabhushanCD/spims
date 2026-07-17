import { Outlet } from "react-router";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import { useAuth } from "@/features/auth/context/authContext";

export default function DashboardLayout() {
  const { theme } = useAuth();

  return (
    <div
      className={`flex h-screen overflow-hidden ${theme === "dark" ? "dark" : ""}`}
    >
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Right Content Area */}
      <div className="dark:bg-background flex flex-1 flex-col">
        {/* Fixed Topbar */}
        <Topbar />

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto p-6`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
