import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { notificationService } from "../services/notification.service";
import type { InboxParams } from "../types/notification.types";
import { notificationKeys } from "./notificationKeys";

const STALE_TIME_MS = 30_000;

/**
 * Polling fallback: the socket has no heartbeat and Email/SMS notifications
 * produce no socket event, so the HTTP inbox stays the source of truth.
 */
const POLL_INTERVAL_MS = 60_000;

export function useInbox(params: InboxParams) {
  return useQuery({
    queryKey: notificationKeys.inbox(params),
    queryFn: () => notificationService.getInbox(params),
    staleTime: STALE_TIME_MS,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

/**
 * Cursor-paginated inbox for the `/notifications` page.
 *
 * Deliberately not polled: React Query refetches every loaded page for an
 * infinite query, so a long feed would issue one request per page per minute.
 * Freshness comes from socket/mutation invalidation and focus refetching.
 */
export function useInboxFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: notificationKeys.feed(limit),
    queryFn: ({ pageParam }) =>
      notificationService.getInbox({ limit, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: STALE_TIME_MS,
  });
}
