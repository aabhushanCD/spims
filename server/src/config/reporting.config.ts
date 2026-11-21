/**
 * Reporting timezone configuration.
 *
 * Reporting month/year boundaries must be calculated in one explicit zone.
 * The pharmacy operates in Nepal, so `Asia/Kathmandu` is the default. Set
 * `REPORTING_TIMEZONE` to any valid IANA timezone to override it.
 */

export const DEFAULT_REPORTING_TIME_ZONE = "Asia/Kathmandu";

const validatedZones = new Set<string>([DEFAULT_REPORTING_TIME_ZONE]);

export function resolveReportingTimeZone(
  raw: string | undefined,
): string {
  const candidate = raw?.trim();
  if (!candidate) {
    return DEFAULT_REPORTING_TIME_ZONE;
  }

  if (!validatedZones.has(candidate)) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: candidate });
    } catch {
      throw new Error(
        `Invalid REPORTING_TIMEZONE "${candidate}"; expected an IANA timezone such as ${DEFAULT_REPORTING_TIME_ZONE}`,
      );
    }
    validatedZones.add(candidate);
  }

  return candidate;
}

export function getReportingTimeZone(): string {
  return resolveReportingTimeZone(process.env.REPORTING_TIMEZONE);
}

/** Fails fast at boot when REPORTING_TIMEZONE is set but invalid. */
export function assertReportingConfig(): void {
  getReportingTimeZone();
}
