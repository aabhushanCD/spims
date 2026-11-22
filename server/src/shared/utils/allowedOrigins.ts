const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];

function parseOrigins(value: string | undefined): string[] {
  if (!value) {
    return [...DEFAULT_ORIGINS];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every((origin) => typeof origin === "string")
    ) {
      return parsed;
    }
  } catch {
    // Fall through to the development defaults. The caller logs a warning in
    // createApp when relevant; this helper stays side-effect free.
  }

  return [...DEFAULT_ORIGINS];
}

export function getAllowedOrigins(): string[] {
  return parseOrigins(process.env.ALLOWED_ORIGINS);
}

/**
 * Returns true when the Origin is allow-listed. Requests without an Origin
 * (server-to-server, curl, some tests) are allowed outside production and
 * rejected in production, where browsers always send one for cross-origin
 * requests.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: string[] = getAllowedOrigins(),
): boolean {
  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }

  return allowedOrigins.includes(origin);
}
