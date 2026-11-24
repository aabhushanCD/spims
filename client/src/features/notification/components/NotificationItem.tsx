import type { KeyboardEvent } from "react";
import { Bell, Mail, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import RelativeTime from "@/components/common/RelativeTime";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  InboxNotification,
  NotificationChannel,
  RecipientStatus,
} from "../types/notification.types";

const channelIcons: Record<NotificationChannel, LucideIcon> = {
  InApp: Bell,
  Email: Mail,
  SMS: MessageSquare,
};

/**
 * Delivery labels only cover states the server actually stores. The parent
 * `status` aggregates every recipient, so it is never used for this label.
 */
const statusLabels: Partial<Record<RecipientStatus, string>> = {
  Pending: "Delivery pending",
  Failed: "Delivery failed",
  Skipped: "Not delivered (opted out)",
};

const statusVariants: Partial<
  Record<RecipientStatus, "destructive" | "outline" | "secondary">
> = {
  Failed: "destructive",
  Skipped: "secondary",
  Pending: "outline",
};

interface NotificationItemProps {
  notification: InboxNotification;
  onRead?: (notificationId: string) => void;
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const unread = notification.readAt === null;
  const Icon = channelIcons[notification.type];
  const statusLabel = statusLabels[notification.recipientStatus];
  const statusVariant = statusVariants[notification.recipientStatus] ?? "outline";

  const handleRead = () => {
    if (unread && onRead) {
      onRead(notification._id);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleRead();
    }
  };

  return (
    <div
      role={onRead ? "button" : undefined}
      tabIndex={onRead ? 0 : undefined}
      onClick={handleRead}
      onKeyDown={onRead ? handleKeyDown : undefined}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition",
        onRead && "cursor-pointer",
        unread
          ? "bg-emerald-50/60 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
          : "hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          unread
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "block text-sm",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {notification.title}
          </span>

          {unread && (
            <span
              aria-label="Unread"
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-600"
            />
          )}
        </span>

        <span className="text-muted-foreground mt-0.5 line-clamp-2 block text-xs">
          {notification.message}
        </span>

        <span className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-[11px]">
            <RelativeTime value={notification.createdAt} />
          </span>

          {statusLabel && (
            <Badge variant={statusVariant} className="text-[10px]">
              {statusLabel}
            </Badge>
          )}
        </span>
      </span>
    </div>
  );
}
