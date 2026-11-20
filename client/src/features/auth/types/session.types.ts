export interface SessionSummary {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
