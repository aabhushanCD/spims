import type { AuditStatus } from "../types/audit.types";

export interface AuditFilterInput {
  action?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  status?: AuditStatus;
  fromDate?: string;
  toDate?: string;
}

export function buildAuditParams(
  filters: AuditFilterInput,
  limit = 20,
): Record<string, string | number> {
  const params: Record<string, string | number> = { limit };

  const action = filters.action?.trim();
  const entityType = filters.entityType?.trim();
  const entityId = filters.entityId?.trim();

  if (action) params.action = action;
  if (filters.actorId) params.actorId = filters.actorId;
  if (entityType) params.entityType = entityType;
  if (entityId) params.entityId = entityId;
  if (filters.status) params.status = filters.status;

  if (filters.fromDate) {
    params.from = new Date(`${filters.fromDate}T00:00:00`).toISOString();
  }

  if (filters.toDate) {
    // The audit endpoint uses an inclusive `$lte` bound.
    params.to = new Date(`${filters.toDate}T23:59:59.999`).toISOString();
  }

  return params;
}
