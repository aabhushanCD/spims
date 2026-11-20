import type { InfiniteData } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import type { InboxNotification, InboxPage } from "../types/notification.types";
import { markNotificationReadInCache } from "./inboxCache";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
const READ_AT = "2026-01-02T00:00:00.000Z";

function item(overrides: Partial<InboxNotification> = {}): InboxNotification {
  return {
    _id: "notification-1",
    title: "Low stock alert",
    message: "Paracetamol 500mg is below the reorder level",
    type: "InApp",
    status: "Sent",
    recipientStatus: "Sent",
    sentAt: CREATED_AT,
    readAt: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  };
}

function page(overrides: Partial<InboxPage> = {}): InboxPage {
  return {
    items: [item()],
    nextCursor: null,
    unreadCount: 1,
    ...overrides,
  };
}

function infinite(
  pages: InboxPage[],
): InfiniteData<InboxPage> {
  return { pages, pageParams: [undefined, "cursor-1"] };
}

describe("markNotificationReadInCache", () => {
  it("marks an item read and decrements unreadCount on a plain page", () => {
    const data = page({
      items: [item(), item({ _id: "notification-2", readAt: READ_AT })],
      unreadCount: 2,
    });

    const result = markNotificationReadInCache(data, "notification-1", READ_AT);

    expect(result).not.toBe(data);
    if ("pages" in result) {
      throw new Error("expected a plain inbox page");
    }
    expect(result.items[0]?.readAt).toBe(READ_AT);
    expect(result.items[1]?.readAt).toBe(READ_AT);
    expect(result.unreadCount).toBe(1);
    expect(result.nextCursor).toBeNull();
  });

  it("returns the same reference when the item is already read", () => {
    const data = page({ items: [item({ readAt: READ_AT })] });

    expect(
      markNotificationReadInCache(data, "notification-1", CREATED_AT),
    ).toBe(data);
  });

  it("returns the same reference when the item is missing", () => {
    const data = page();

    expect(
      markNotificationReadInCache(data, "unknown", READ_AT),
    ).toBe(data);
  });

  it("clamps unreadCount at zero", () => {
    const data = page({ unreadCount: 0 });

    const result = markNotificationReadInCache(data, "notification-1", READ_AT);

    if ("pages" in result) {
      throw new Error("expected a plain inbox page");
    }
    expect(result.unreadCount).toBe(0);
    expect(result.items[0]?.readAt).toBe(READ_AT);
  });

  it("decrements only the first page of an infinite cache", () => {
    const data = infinite([
      page({ items: [item()], unreadCount: 4, nextCursor: "cursor-1" }),
      page({
        items: [item({ _id: "notification-2" })],
        unreadCount: 4,
        nextCursor: "cursor-2",
      }),
    ]);

    const result = markNotificationReadInCache(
      data,
      "notification-2",
      READ_AT,
    );

    if (!("pages" in result)) {
      throw new Error("expected an infinite cache");
    }
    expect(result.pages[0]?.unreadCount).toBe(3);
    expect(result.pages[1]?.unreadCount).toBe(4);
    expect(result.pages[0]?.items[0]?.readAt).toBeNull();
    expect(result.pages[1]?.items[0]?.readAt).toBe(READ_AT);
    expect(result.pages[0]?.nextCursor).toBe("cursor-1");
    expect(result.pages[1]?.nextCursor).toBe("cursor-2");
    expect(result.pageParams).toEqual([undefined, "cursor-1"]);
  });

  it("decrements once when the item is on the first infinite page", () => {
    const data = infinite([
      page({ items: [item()], unreadCount: 1 }),
      page({ items: [], unreadCount: 1 }),
    ]);

    const result = markNotificationReadInCache(
      data,
      "notification-1",
      READ_AT,
    );

    if (!("pages" in result)) {
      throw new Error("expected an infinite cache");
    }
    expect(result.pages[0]?.unreadCount).toBe(0);
    expect(result.pages[1]?.unreadCount).toBe(1);
  });

  it("does not mutate the input cache", () => {
    const plainItem = item();
    const data = page({ items: [plainItem], unreadCount: 1 });

    markNotificationReadInCache(data, "notification-1", READ_AT);

    expect(plainItem.readAt).toBeNull();
    expect(data.items[0]?.readAt).toBeNull();
    expect(data.unreadCount).toBe(1);

    const infiniteData = infinite([
      page({ items: [item()], unreadCount: 2 }),
      page({ items: [item({ _id: "notification-2" })], unreadCount: 2 }),
    ]);

    markNotificationReadInCache(infiniteData, "notification-2", READ_AT);

    expect(infiniteData.pages[0]?.unreadCount).toBe(2);
    expect(infiniteData.pages[1]?.items[0]?.readAt).toBeNull();
  });

  it("returns the same reference when an infinite item is missing", () => {
    const data = infinite([page(), page({ items: [] })]);

    expect(markNotificationReadInCache(data, "unknown", READ_AT)).toBe(data);
  });
});
