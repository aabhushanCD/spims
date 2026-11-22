const DURATION_UNITS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

const DEFAULT_ACCESS_TTL_MS = 15 * 60_000;
const DEFAULT_REFRESH_TTL_MS = 7 * 86_400_000;
const DEFAULT_RESET_TTL_MS = 30 * 60_000;
const DEFAULT_VERIFICATION_TTL_MS = 24 * 3_600_000;
const DEFAULT_MAX_SESSIONS = 10;
const DEFAULT_REFRESH_REUSE_GRACE_MS = 60_000;
const DEFAULT_LOCKOUT_THRESHOLD = 5;
const DEFAULT_LOCKOUT_WINDOW_MS = 15 * 60_000;
const DEFAULT_LOCKOUT_DURATION_MS = 15 * 60_000;

export function parseDuration(value: string | undefined, fallbackMs: number): number {
  if (!value) {
    return fallbackMs;
  }

  const match = /^(\d+)\s*(s|m|h|d)$/i.exec(value.trim());
  if (!match) {
    return fallbackMs;
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const multiplier = unit ? DURATION_UNITS[unit] : undefined;

  if (!Number.isFinite(amount) || amount <= 0 || !multiplier) {
    return fallbackMs;
  }

  return amount * multiplier;
}

export function getAccessTokenTtlMs(): number {
  return parseDuration(process.env.JWT_ACCESS_EXPIRES_IN, DEFAULT_ACCESS_TTL_MS);
}

export function getRefreshTokenTtlMs(): number {
  return parseDuration(process.env.JWT_REFRESH_EXPIRES_IN, DEFAULT_REFRESH_TTL_MS);
}

export function getPasswordResetTtlMs(): number {
  return parseDuration(
    process.env.PASSWORD_RESET_EXPIRES_IN,
    DEFAULT_RESET_TTL_MS,
  );
}

export function getEmailVerificationTtlMs(): number {
  return parseDuration(
    process.env.EMAIL_VERIFICATION_EXPIRES_IN,
    DEFAULT_VERIFICATION_TTL_MS,
  );
}

export function getRefreshReuseGraceMs(): number {
  return parseDuration(
    process.env.REFRESH_TOKEN_GRACE_PERIOD,
    DEFAULT_REFRESH_REUSE_GRACE_MS,
  );
}

export function getMaxSessionsPerUser(): number {
  const value = Number(process.env.MAX_SESSIONS_PER_USER);
  return Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : DEFAULT_MAX_SESSIONS;
}

export function getLockoutThreshold(): number {
  const value = Number(process.env.AUTH_LOCKOUT_THRESHOLD);
  return Number.isInteger(value) && value > 0
    ? value
    : DEFAULT_LOCKOUT_THRESHOLD;
}

export function getLockoutWindowMs(): number {
  return parseDuration(
    process.env.AUTH_LOCKOUT_WINDOW,
    DEFAULT_LOCKOUT_WINDOW_MS,
  );
}

export function getLockoutDurationMs(): number {
  return parseDuration(
    process.env.AUTH_LOCKOUT_DURATION,
    DEFAULT_LOCKOUT_DURATION_MS,
  );
}

export function getClientUrl(): string {
  return (process.env.CLIENT_URL ?? "http://localhost:5173").replace(
    /\/$/,
    "",
  );
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return getJwtSecret();
}

export function assertAuthConfig(): void {
  const missing: string[] = [];

  if (!process.env.JWT_SECRET) {
    missing.push("JWT_SECRET");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.JWT_REFRESH_SECRET) {
      missing.push("JWT_REFRESH_SECRET");
    }
    if (!process.env.CLIENT_URL) {
      missing.push("CLIENT_URL");
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required auth environment variables: ${missing.join(", ")}`,
    );
  }
}
