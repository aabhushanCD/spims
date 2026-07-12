import { Outlet } from "react-router";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";


export default function DashboardLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Right Content Area */}
      <div className="flex flex-1 flex-col">
        {/* Fixed Topbar */}
        <Topbar />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
      </div>
    </div>
  );
}
