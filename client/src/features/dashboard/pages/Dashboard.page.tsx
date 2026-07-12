import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import RevenueChart from "@/components/dashboard/RevenueChart";

import InventoryHealth from "@/components/dashboard/InventoryHealth";
import RecentSales from "@/components/dashboard/RecentSales";
import LowStockMedicines from "@/components/dashboard/LowStockMedicines";
import ExpiringMedicines from "@/components/dashboard/ExpiringMedicines";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import NotificationsPanel from "@/components/dashboard/NotificationsPanel";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader />

      {/* KPI Cards */}
      <StatsGrid />

      {/* Analytics */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        <InventoryHealth />
      </section>

      {/* Sales + Stock */}
      <section className="grid gap-6 lg:grid-cols-2">
        <RecentSales />

        <LowStockMedicines />
      </section>

      {/* Expiry + Actions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ExpiringMedicines />

        <QuickActions />
      </section>

      {/* Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ActivityTimeline />

        <NotificationsPanel />
      </section>
    </div>
  );
}
