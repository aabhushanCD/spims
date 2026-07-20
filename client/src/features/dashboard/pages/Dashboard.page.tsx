import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsGrid from "@/components/dashboard/StatsGrid";
import RevenueChart from "@/components/dashboard/RevenueChart";

import InventoryHealth from "@/components/dashboard/InventoryHealth";
import RecentSales from "@/components/dashboard/RecentSales";
import LowStockMedicines from "@/components/dashboard/LowStockMedicines";
import ExpiringMedicines from "@/components/dashboard/ExpiringMedicines";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
// import NotificationsPanel from "@/components/dashboard/NotificationsPanel";
import { useAuth } from "@/features/auth/context/authContext";
import { useGetDashboard } from "../hooks/useGetDashboard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
// import { ReorderSummary } from "@/features/smart/components/ReorderSummary";
import { ReorderRecommendationCard } from "@/features/smart/components/ReorderRecommendationCard";
import { useGetRecommendations } from "@/features/smart/hooks/useSmartQuery";

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboard();
  const recommendations = useGetRecommendations(); // Fetch recommendations using the custom hook
  const { theme } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        Error loading dashboard data.
      </div>
    );
  }
  const dashboard = data.data;

  return (
    <div className={`space-y-8 ${theme === "dark" ? "dark" : ""}`}>
      {/* Header */}
      <DashboardHeader />

      {/* KPI Cards */}
      <StatsGrid summary={dashboard.summary} />

      {/* Analytics */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <ReorderRecommendationCard recommendations={recommendations.data} />
        </div>
        <div className="lg:col-span-2">
          <RevenueChart revenueTrend={dashboard.summary.revenueTrend} />
        </div>
      </section>

      {/* Sales + Stock */}
      <section className="grid gap-6 lg:grid-cols-2">
        <LowStockMedicines
        // summary={dashboard.summary}
        // reorder={dashboard.reorder}
        />
        <InventoryHealth
          summary={dashboard.summary}
          reorder={dashboard.reorder}
          expiry={dashboard.expiry}
        />
      </section>

      {/* Expiry + Actions */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ExpiringMedicines
        //  expiry={dashboard.expiry}
        />

        <QuickActions />
      </section>

      {/* Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ActivityTimeline activities={dashboard.recentActivity} />
        <RecentSales
        // activities={dashboard.recentActivity}
        />
        {/* <NotificationsPanel
          notifications={dashboard.notifications}
          health={dashboard.health}
        /> */}
      </section>
    </div>
  );
}
