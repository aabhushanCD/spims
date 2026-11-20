import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useAuth } from "@/features/auth/context/authContext";
import { resolveNotificationSocketUrl } from "../lib/notificationSocketUrl";
import { notificationKeys } from "./notificationKeys";

const MAX_RECONNECT_DELAY_MS = 30_000;
const BASE_RECONNECT_DELAY_MS = 1_000;

function parseSocketMessage(
  raw: unknown,
): { title: string; message: string } | null {
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    const { title, message } = record;

    if (typeof title !== "string" || typeof message !== "string") {
      return null;
    }

    return { title, message };
  } catch {
    return null;
  }
}

/**
 * Keeps one notification socket open for the signed-in user.
 *
 * Mount once, inside the protected layout. Known server limitations (see
 * `server/docs/infrastructure/realtime-communication.md`):
 * - Email/SMS notifications emit no socket event; the 60s inbox polling and
 *   focus refetching cover them.
 * - The server has no heartbeat and does not re-check JWT expiry after the
 *   upgrade, so we close on unmount/logout and rely on `close` for reconnects.
 *
 * `StrictMode` mounts effects twice; the cleanup below disposes the first
 * socket before the second effect runs.
 */
export function useNotificationSocket() {
  const { currentUser } = useAuth();
  const userId = currentUser?._id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) {
      return;
    }

    const url = resolveNotificationSocketUrl({
      wsUrl: import.meta.env.VITE_WS_URL,
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      origin: window.location.origin,
    });

    let disposed = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let socket: WebSocket | undefined;

    const scheduleReconnect = () => {
      if (disposed || reconnectTimer !== undefined) {
        return;
      }

      const delay = Math.min(
        BASE_RECONNECT_DELAY_MS * 2 ** attempt,
        MAX_RECONNECT_DELAY_MS,
      );
      attempt += 1;

      reconnectTimer = setTimeout(() => {
        reconnectTimer = undefined;
        connect();
      }, delay);
    };

    const connect = () => {
      if (disposed) {
        return;
      }

      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
      };

      socket.onmessage = (event: MessageEvent<unknown>) => {
        const payload = parseSocketMessage(event.data);
        if (!payload) {
          return;
        }

        toast.info(payload.title);
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.inboxes(),
        });
      };

      // Only `close` schedules a reconnect: browsers fire `error` before
      // `close`, and scheduling from both would double the attempts.
      socket.onerror = () => {};

      socket.onclose = () => {
        socket = undefined;
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      disposed = true;

      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }

      const current = socket;
      socket = undefined;

      if (!current) {
        return;
      }

      current.onopen = null;
      current.onerror = null;
      current.onmessage = null;
      current.onclose = null;

      if (
        current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING
      ) {
        current.close();
      }
    };
  }, [userId, queryClient]);
}
