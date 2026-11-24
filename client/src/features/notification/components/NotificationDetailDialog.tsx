import { Loader2, RefreshCw, Send, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AppDate from "@/components/common/AppDate";
import RelativeTime from "@/components/common/RelativeTime";
import {
  useAdminNotification,
  useDeleteAdminNotification,
  useDispatchAdminNotification,
  useRetryAdminNotification,
} from "../hooks/useNotificationAdmin";

interface Props {
  id: string;
  onOpenChange: (open: boolean) => void;
}

export default function NotificationDetailDialog({
  id,
  onOpenChange,
}: Props) {
  const detail = useAdminNotification(id);
  const dispatch = useDispatchAdminNotification(id);
  const retry = useRetryAdminNotification(id);
  const remove = useDeleteAdminNotification();

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Notification detail</DialogTitle>
          <DialogDescription>
            Delivery status and recipient rows.
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : detail.isError || !detail.data ? (
          <p className="text-destructive text-sm">
            Could not load the notification.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{detail.data.title}</h3>
                <Badge>{detail.data.status}</Badge>
                <Badge variant="secondary">{detail.data.type}</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">
                {detail.data.message}
              </p>
              <p className="text-muted-foreground text-xs">
                <AppDate value={detail.data.createdAt} style="datetime" />
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={dispatch.isPending}
                onClick={() => dispatch.mutate(false)}
              >
                <Send className="mr-2 h-4 w-4" />
                Dispatch
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={dispatch.isPending}
                onClick={() => dispatch.mutate(true)}
              >
                Force dispatch
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={retry.isPending}
                onClick={() => retry.mutate()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry failed
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(id, { onSuccess: () => onOpenChange(false) })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Last attempt</TableHead>
                    <TableHead>Next attempt</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.data.recipients.map((recipient) => (
                    <TableRow key={recipient._id}>
                      <TableCell className="text-xs">
                        {recipient.userId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{recipient.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {recipient.sentAt ? (
                          <RelativeTime value={recipient.sentAt} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {recipient.readAt ? (
                          <RelativeTime value={recipient.readAt} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{recipient.attempts ?? "-"}</TableCell>
                      <TableCell>
                        {recipient.lastAttemptAt ? (
                          <RelativeTime value={recipient.lastAttemptAt} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {recipient.nextAttemptAt ? (
                          <RelativeTime value={recipient.nextAttemptAt} />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-destructive max-w-48 truncate text-xs">
                        {recipient.error ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
