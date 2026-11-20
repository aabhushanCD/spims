import { useNavigate } from "react-router";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useInbox } from "../hooks/useInbox";
import { useMarkRead } from "../hooks/useMarkRead";
import NotificationItem from "./NotificationItem";

function PanelSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3 px-3 py-2">
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

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useInbox({ limit: 5 });
  const markRead = useMarkRead();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Notifications</CardTitle>

            <CardDescription>Your latest updates</CardDescription>
          </div>

          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-1">
        {isLoading && <PanelSkeleton />}

        {!isLoading && isError && (
          <div className="space-y-2 py-4 text-center">
            <p className="text-muted-foreground text-sm">
              Could not load notifications.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <p className="text-muted-foreground py-6 text-center text-sm">
            You are all caught up.
          </p>
        )}

        {!isLoading &&
          !isError &&
          items.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onRead={(notificationId) => markRead.mutate(notificationId)}
            />
          ))}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/notifications")}
        >
          View all notifications
        </Button>
      </CardFooter>
    </Card>
  );
}
