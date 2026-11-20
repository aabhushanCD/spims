import { Bell, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useInbox } from "../hooks/useInbox";
import { useMarkAllRead } from "../hooks/useMarkAllRead";
import { useMarkRead } from "../hooks/useMarkRead";
import NotificationItem from "./NotificationItem";

function DropdownSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3 px-2 py-2">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useInbox({ limit: 10 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />

          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>

          <Button
            variant="ghost"
            size="xs"
            disabled={unreadCount === 0 || markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading && <DropdownSkeleton />}

          {!isLoading && isError && (
            <div className="space-y-2 px-3 py-6 text-center">
              <p className="text-muted-foreground text-sm">
                Could not load notifications.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              You are all caught up.
            </p>
          )}

          {!isLoading &&
            !isError &&
            items.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className="p-0 focus:bg-transparent"
                onSelect={(event) => {
                  // Keep the menu open while the row is marked read.
                  event.preventDefault();
                  if (notification.readAt === null) {
                    markRead.mutate(notification._id);
                  }
                }}
              >
                <NotificationItem notification={notification} />
              </DropdownMenuItem>
            ))}
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuItem
            onSelect={() => navigate("/settings/notifications")}
          >
            Preferences
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => navigate("/notifications")}>
            View all notifications
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
