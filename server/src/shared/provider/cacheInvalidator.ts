/**
 * Cache invalidation is deliberately injected rather than imported directly by
 * services. Unit tests get the no-op implementation and never open a Redis
 * connection, while the production container supplies the Redis-backed one.
 */
export interface CacheInvalidator {
  invalidateDashboard(): Promise<void>;
  invalidateReorder(medicineId: string): Promise<void>;
}

export const noopCacheInvalidator: CacheInvalidator = {
  async invalidateDashboard(): Promise<void> {},
  async invalidateReorder(): Promise<void> {},
};
