import type {
  DashboardMovement,
  DashboardSummary,
  MonthlySalesPoint,
} from "../types/dashboard";

/**
 * A brand-new pharmacy has no batches and no movements. The revenue series is
 * zero-filled Jan..current month, so a non-empty array is not evidence of use.
 */
export function isNewPharmacy(
  summary: Pick<DashboardSummary, "totalMedicineBatches">,
  recentActivity: DashboardMovement[],
): boolean {
  return summary.totalMedicineBatches === 0 && recentActivity.length === 0;
}

/** True when at least one month has recorded revenue. */
export function hasRevenue(points: MonthlySalesPoint[]): boolean {
  return points.some((point) => point.total > 0);
}

/** Total gross revenue across the returned monthly series. */
export function totalRevenue(points: MonthlySalesPoint[]): number {
  return points.reduce((sum, point) => sum + point.total, 0);
}

/** Best month in the series, or null when every month is empty. */
export function bestRevenueMonth(
  points: MonthlySalesPoint[],
): MonthlySalesPoint | null {
  return points.reduce<MonthlySalesPoint | null>((best, point) => {
    if (point.total <= 0) {
      return best;
    }

    if (!best || point.total > best.total) {
      return point;
    }

    return best;
  }, null);
}
