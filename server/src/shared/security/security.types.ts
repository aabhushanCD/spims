/**
 * Small interfaces for the account-security side effects. Services depend on
 * these instead of Redis or Mongoose directly so unit tests can inject no-op or
 * fake implementations without opening a network connection.
 */

export interface LockoutState {
  locked: boolean;
  retryAfterSeconds: number;
}

export interface LoginAttemptTracker {
  check(email: string): Promise<LockoutState>;
  recordFailure(email: string): Promise<LockoutState>;
  recordSuccess(email: string): Promise<void>;
}

export type AuditStatus = "SUCCESS" | "FAILURE";

export interface AuditEvent {
  actorId?: string | undefined;
  actorRole?: string | undefined;
  action: string;
  entityType: string;
  entityId?: string | undefined;
  status?: AuditStatus | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
  requestId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export interface AuditRecorder {
  record(event: AuditEvent): Promise<void>;
}

export interface SessionRevocation {
  revokeSessionAccessToken(sessionId: string): Promise<void>;
}

export interface TokenVersionMaintenance {
  invalidate(userId: string): Promise<void>;
}

const UNLOCKED: LockoutState = { locked: false, retryAfterSeconds: 0 };

export const noopLoginAttemptTracker: LoginAttemptTracker = {
  async check(): Promise<LockoutState> {
    return UNLOCKED;
  },
  async recordFailure(): Promise<LockoutState> {
    return UNLOCKED;
  },
  async recordSuccess(): Promise<void> {
    // Nothing to clear when lockout tracking is not configured.
  },
};

export const noopAuditRecorder: AuditRecorder = {
  async record(): Promise<void> {
    // Audit persistence is optional in unit tests.
  },
};

export const noopSessionRevocation: SessionRevocation = {
  async revokeSessionAccessToken(): Promise<void> {
    // Access tokens still expire on their own when no deny-list is present.
  },
};

export const noopTokenVersionMaintenance: TokenVersionMaintenance = {
  async invalidate(): Promise<void> {
    // No cache to invalidate in unit tests.
  },
};
