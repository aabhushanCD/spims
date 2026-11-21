export const DASHBOARD_CACHE_KEY = "dashboard:full-summary";

export function reorderCacheKey(medicineId: string): string {
  return `reorder:${medicineId}`;
}
