import ActivityTimeline from "../components/ActivityTimeline";
import DashboardHeader from "../components/DashboardHeader";
import InventoryHealth from "../components/InventoryHealth";
import QuickActions from "../components/QuickActions";
import RevenueChart from "../components/RevenueChart";
import StatsGrid from "../components/StatsGrid";
import NotificationsPanel from "@/features/notification/components/NotificationsPanel";
import { useGetDashboard } from "../hooks/useGetDashboard";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { ReorderRecommendationCard } from "@/features/smart/components/ReorderRecommendationCard";
import { useGetRecommendations } from "@/features/smart/hooks/useSmartQuery";

export default function Dashboard() {
  const { data, isLoading, isError } = useGetDashboard();
  const recommendations = useGetRecommendations(); // Fetch recommendations using the custom hook

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
  const dashboard = data?.data;

  if (!dashboard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <DashboardHeader />

      {/* KPI Cards */}
      <StatsGrid summary={dashboard.summary} />

      {/* Analytics */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <ReorderRecommendationCard
            recommendations={recommendations.data ?? []}
          />
        </div>
        <div className="lg:col-span-2">
          <RevenueChart revenueTrend={dashboard.summary.revenueTrend} />
        </div>
      </section>

      {/* Sales + Stock */}
      <section className="grid gap-6 lg:grid-cols-2">
        <InventoryHealth
          summary={dashboard.summary}
          reorder={dashboard.reorder}
          expiry={dashboard.expiry}
        />
        <QuickActions />
      </section>

      {/* Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ActivityTimeline activities={dashboard.recentActivity} />
        <NotificationsPanel />
      </section>
    </div>
  );
}
