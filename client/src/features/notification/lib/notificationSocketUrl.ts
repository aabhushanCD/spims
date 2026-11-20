export interface NotificationSocketUrlInput {
  /** Raw value of `VITE_WS_URL`, if configured. */
  wsUrl?: string | undefined;
  /** Raw value of `VITE_API_BASE_URL`, if configured. */
  apiBaseUrl?: string | undefined;
  /** `window.location.origin`, injected so this stays testable without jsdom. */
  origin: string;
}

const ABSOLUTE_HTTP_URL = /^https?:\/\//i;
const SOCKET_PATH = "/ws";

function toSocketProtocol(protocol: string): string {
  return protocol === "https:" || protocol === "wss:" ? "wss:" : "ws:";
}

function normalizeSocketUrl(raw: string, base: string): string {
  const url = new URL(raw, base);
  url.protocol = toSocketProtocol(url.protocol);
  // The server mounts the socket at `/ws` and does not accept query tokens.
  url.search = "";
  url.hash = "";
  return url.toString();
}

function fallbackFromOrigin(origin: string): string {
  const trimmed = origin.trim().replace(/\/+$/, "");

  if (trimmed.startsWith("https://")) {
    return `wss://${trimmed.slice("https://".length)}${SOCKET_PATH}`;
  }
  if (trimmed.startsWith("http://")) {
    return `ws://${trimmed.slice("http://".length)}${SOCKET_PATH}`;
  }

  return `${trimmed}${SOCKET_PATH}`;
}

/**
 * Resolves the notification socket URL.
 *
 * Priority:
 * 1. `VITE_WS_URL` — protocol normalized, path preserved.
 * 2. Absolute `VITE_API_BASE_URL` — same origin, path replaced with `/ws`.
 * 3. The page origin plus `/ws` (this is the case that goes through the Vite
 *    dev proxy).
 *
 * Cookies are sent automatically by the browser; `new WebSocket` supports no
 * `withCredentials` option.
 */
export function resolveNotificationSocketUrl(
  input: NotificationSocketUrlInput,
): string {
  const wsUrl = input.wsUrl?.trim();
  if (wsUrl) {
    try {
      return normalizeSocketUrl(wsUrl, input.origin);
    } catch {
      // fall through to the API/origin candidates
    }
  }

  const apiBaseUrl = input.apiBaseUrl?.trim();
  if (apiBaseUrl && ABSOLUTE_HTTP_URL.test(apiBaseUrl)) {
    try {
      const apiUrl = new URL(apiBaseUrl);
      apiUrl.protocol = toSocketProtocol(apiUrl.protocol);
      apiUrl.pathname = SOCKET_PATH;
      apiUrl.search = "";
      apiUrl.hash = "";
      return apiUrl.toString();
    } catch {
      // fall through to the origin candidate
    }
  }

  try {
    return normalizeSocketUrl(SOCKET_PATH, input.origin);
  } catch {
    return fallbackFromOrigin(input.origin);
  }
}
