import ActionCenter from "../components/ActionCenter";
import ActivityTimeline from "../components/ActivityTimeline";
import DashboardHeader from "../components/DashboardHeader";
import DashboardSkeleton from "../components/DashboardSkeleton";
import InventoryHealth from "../components/InventoryHealth";
import OnboardingChecklist from "../components/OnboardingChecklist";
import QuickActions from "../components/QuickActions";
import RevenueChart from "../components/RevenueChart";
import StatsGrid from "../components/StatsGrid";
import SystemHealthBanner from "../components/SystemHealthBanner";
import TopSellingCard from "../components/TopSellingCard";
import ErrorState from "@/components/common/ErrorState";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import NotificationsPanel from "@/features/notification/components/NotificationsPanel";
import { ReorderRecommendationCard } from "@/features/smart/components/ReorderRecommendationCard";
import { useGetPendingRecommendations } from "@/features/smart/hooks/useSmartQuery";
import { useGetDashboard } from "../hooks/useGetDashboard";
import { isNewPharmacy } from "../lib/dashboardState";

export default function Dashboard() {
  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useGetDashboard();
  const recommendations = useGetPendingRecommendations();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const dashboard = data?.data;

  if (isError || !dashboard) {
    return (
      <div className="space-y-8">
        <DashboardHeader />

        <ErrorState
          message={getApiErrorMessage(
            error,
            "Could not load the dashboard. Please try again.",
          )}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

  const header = (
    <DashboardHeader
      lastUpdated={dataUpdatedAt}
      isRefreshing={isFetching}
      onRefresh={() => {
        void refetch();
      }}
    />
  );

  if (isNewPharmacy(dashboard.summary, dashboard.recentActivity)) {
    return (
      <div className="space-y-8">
        {header}
        <OnboardingChecklist />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}

      <ActionCenter
        summary={dashboard.summary}
        expiry={dashboard.expiry}
        reorder={dashboard.reorder}
        notifications={dashboard.notifications}
      />

      <SystemHealthBanner systemHealth={dashboard.systemHealth} />

      <StatsGrid
        summary={dashboard.summary}
        profit={dashboard.profit}
        salesComparison={dashboard.salesComparison}
      />

      <section
        aria-label="Revenue and reorder recommendations"
        className="grid gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <RevenueChart revenueTrend={dashboard.summary.revenueTrend} />
        </div>

        <ReorderRecommendationCard
          recommendations={recommendations.data ?? []}
          summary={dashboard.reorder}
          isLoading={recommendations.isPending}
          isError={recommendations.isError}
          onRetry={() => {
            void recommendations.refetch();
          }}
        />
      </section>

      <section
        aria-label="Stock health, shortcuts and top selling medicines"
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <InventoryHealth summary={dashboard.summary} expiry={dashboard.expiry} />
        <QuickActions />
        <TopSellingCard topSelling={dashboard.topSelling} />
      </section>

      <section
        aria-label="Recent activity and notifications"
        className="grid gap-6 lg:grid-cols-2"
      >
        <ActivityTimeline activities={dashboard.recentActivity} />
        <NotificationsPanel />
      </section>
    </div>
  );
}
