export const MAX_SEND_ATTEMPTS = 3;
export const RETRY_DELAYS_MS = [60_000, 300_000] as const;
export const MAX_ERROR_LENGTH = 1000;
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;
export const MAX_NOTIFICATION_RECIPIENTS = 500;

/**
 * How long a claimed-but-unfinished delivery may stay in flight before the
 * sweep treats it as abandoned (crash, lost worker). Must stay well above the
 * SMTP/socket timeouts; it bounds the at-least-once redelivery window.
 */
export const STALE_IN_FLIGHT_MS = 15 * 60_000;

