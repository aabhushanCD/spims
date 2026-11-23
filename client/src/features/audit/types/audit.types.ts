export type AuditStatus = "SUCCESS" | "FAILURE";

export interface AuditLog {
  _id: string;
  actorId?: string | null;
  actorRole?: string | null;
  actor?: {
    _id: string;
    name: string;
    email: string;
    role: string | null;
  } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  status: AuditStatus;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditPage {
  items: AuditLog[];
  nextCursor: string | null;
}

export interface AuditListParams {
  action?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  status?: AuditStatus;
  from?: string;
  to?: string;
  cursor?: string;
}
