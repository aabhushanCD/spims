import { useNavigate } from "react-router";
import { CheckCheck, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationItem from "../components/NotificationItem";
import { useInboxFeed } from "../hooks/useInbox";
import { useMarkAllRead } from "../hooks/useMarkAllRead";
import { useMarkRead } from "../hooks/useMarkRead";

function PageSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex gap-3 px-3 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const feed = useInboxFeed(20);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = feed.data?.pages.flatMap((page) => page.items) ?? [];
  const unreadCount = feed.data?.pages[0]?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>

          <p className="text-muted-foreground text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You are all caught up"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/settings/notifications")}
          >
            <Settings className="h-4 w-4" />
            Preferences
          </Button>

          <Button
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </header>

      <Card>
        <CardContent>
          {feed.isLoading && <PageSkeleton />}

          {!feed.isLoading && feed.isError && (
            <div className="space-y-3 py-8 text-center">
              <p className="text-muted-foreground text-sm">
                Could not load notifications.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => feed.refetch()}
              >
                Try again
              </Button>
            </div>
          )}

          {!feed.isLoading && !feed.isError && items.length === 0 && (
            <p className="text-muted-foreground py-10 text-center text-sm">
              You have no notifications yet.
            </p>
          )}

          {!feed.isLoading && !feed.isError && items.length > 0 && (
            <div className="space-y-1">
              {items.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onRead={(notificationId) => markRead.mutate(notificationId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!feed.isLoading && !feed.isError && items.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={!feed.hasNextPage || feed.isFetchingNextPage}
            onClick={() => feed.fetchNextPage()}
          >
            {feed.isFetchingNextPage
              ? "Loading…"
              : feed.hasNextPage
                ? "Load more"
                : "No more notifications"}
          </Button>
        </div>
      )}
    </div>
  );
}
