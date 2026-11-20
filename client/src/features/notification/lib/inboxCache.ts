import type { InfiniteData } from "@tanstack/react-query";
import type { InboxPage } from "../types/notification.types";

/**
 * Both shapes can live under `notificationKeys.inboxes()`: fixed-size inbox
 * queries cache `InboxPage`, the full page caches `InfiniteData<InboxPage>`.
 */
export type InboxCacheData = InboxPage | InfiniteData<InboxPage>;

export function isInfiniteInboxData(
  data: InboxCacheData,
): data is InfiniteData<InboxPage> {
  return "pages" in data;
}

/** Returns a page with the item marked read, or `null` when nothing changed. */
function withItemRead(
  page: InboxPage,
  notificationId: string,
  readAt: string,
): InboxPage | null {
  const index = page.items.findIndex((item) => item._id === notificationId);

  if (index === -1) {
    return null;
  }

  const target = page.items[index];
  if (!target || target.readAt !== null) {
    return null;
  }

  const items = page.items.slice();
  items[index] = { ...target, readAt };

  return { ...page, items };
}

/**
 * The server repeats the global unread count on every page, so it is
 * decremented exactly once: on the plain page, or on `pages[0]` for an
 * infinite cache.
 */
function withUnreadDecremented(page: InboxPage): InboxPage {
  return { ...page, unreadCount: Math.max(0, page.unreadCount - 1) };
}

function markReadInPage(
  page: InboxPage,
  notificationId: string,
  readAt: string,
): InboxPage | null {
  const updated = withItemRead(page, notificationId, readAt);
  return updated ? withUnreadDecremented(updated) : null;
}

/**
 * Marks one notification as read inside a cached inbox. Returns the same
 * reference when the item is missing or already read, mirroring the server's
 * idempotent `markRead`.
 */
export function markNotificationReadInCache(
  data: InboxCacheData,
  notificationId: string,
  readAt: string,
): InboxCacheData {
  if (!isInfiniteInboxData(data)) {
    return markReadInPage(data, notificationId, readAt) ?? data;
  }

  const pages = data.pages.slice();
  let changed = false;

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    if (!page) {
      continue;
    }

    const updated = withItemRead(page, notificationId, readAt);
    if (!updated) {
      continue;
    }

    pages[index] = updated;
    changed = true;
    break;
  }

  if (!changed) {
    return data;
  }

  const firstPage = pages[0];
  if (firstPage) {
    pages[0] = withUnreadDecremented(firstPage);
  }

  return { ...data, pages };
}
