import type { InboxParams } from "../types/notification.types";

/**
 * Kept in a `.ts` module with no component exports so the
 * `react-refresh/only-export-components` rule stays satisfied.
 *
 * `feed` must have its own key: `useInbox` caches `InboxPage` while
 * `useInboxFeed` caches `InfiniteData<InboxPage>`, so sharing a key would
 * corrupt the cache shape.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  inboxes: () => [...notificationKeys.all, "inbox"] as const,
  inbox: (params: InboxParams) =>
    [...notificationKeys.inboxes(), params] as const,
  feed: (limit: number) =>
    [...notificationKeys.inboxes(), "feed", limit] as const,
  preferences: () => [...notificationKeys.all, "preferences"] as const,
};
