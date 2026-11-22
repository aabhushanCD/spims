import { useState } from "react";
import { Eye, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { useAuth } from "@/features/auth/context/authContext";
import { formatDateTime } from "@/lib/format";
import ComposeNotificationDialog from "../components/ComposeNotificationDialog";
import NotificationDetailDialog from "../components/NotificationDetailDialog";
import UserNotificationPreferencesDialog from "../components/UserNotificationPreferencesDialog";
import { useAdminNotifications } from "../hooks/useNotificationAdmin";
import type {
  DeliveryStatus,
  NotificationChannel,
} from "../types/notification.types";

const statuses: DeliveryStatus[] = ["Pending", "Sent", "Failed"];
const channels: NotificationChannel[] = ["Email", "SMS", "InApp"];

export default function NotificationAdminPage() {
  const { currentUser } = useAuth();
  const isOwner = currentUser?.role === "owner";
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const [type, setType] = useState<NotificationChannel | "ALL">("ALL");
  const [composeOpen, setComposeOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useAdminNotifications({
    ...(status === "ALL" ? {} : { status }),
    ...(type === "ALL" ? {} : { type }),
  });

  const notifications =
    list.data?.pages.flatMap((page) => page.items) ?? [];

  if (list.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Admin"
        description="Compose notifications and inspect delivery status."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as DeliveryStatus | "ALL")
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {statuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as NotificationChannel | "ALL")
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All channels</SelectItem>
                {channels.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isOwner && (
              <Button variant="outline" onClick={() => setPrefsOpen(true)}>
                User preferences
              </Button>
            )}

            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        }
      />

      {list.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(list.error, "Failed to load notifications.")}
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No notifications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow key={notification._id}>
                        <TableCell className="max-w-md truncate font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell>{notification.type}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              notification.status === "Failed"
                                ? "destructive"
                                : notification.status === "Sent"
                                  ? "default"
                                  : "secondary"
                            }
                          >
                            {notification.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateTime(notification.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedId(notification._id)}
                            aria-label="View notification"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={!list.hasNextPage || list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage
                ? "Loading…"
                : list.hasNextPage
                  ? "Load more"
                  : "No more notifications"}
            </Button>
          </div>
        </>
      )}

      {composeOpen && (
        <ComposeNotificationDialog onOpenChange={setComposeOpen} />
      )}

      {prefsOpen && (
        <UserNotificationPreferencesDialog
          onOpenChange={setPrefsOpen}
        />
      )}

      {selectedId && (
        <NotificationDetailDialog
          id={selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </div>
  );
}
