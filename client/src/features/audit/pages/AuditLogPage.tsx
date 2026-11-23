import { useMemo, useState } from "react";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PageHeader from "@/components/common/PageToolbar";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import UserSearchSelect from "@/features/user/components/UserSearchSelect";
import type { User } from "@/features/user/types/user.types";
import { formatDateTime } from "@/lib/format";
import AuditDetailDialog from "../components/AuditDetailDialog";
import { useAuditLogs } from "../hooks/useAuditLogs";
import type { AuditLog, AuditStatus } from "../types/audit.types";

const actions = [
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAILURE",
  "AUTH_LOGIN_LOCKED",
  "AUTH_LOGOUT",
  "AUTH_LOGOUT_ALL",
  "AUTH_SESSION_REVOKED",
  "AUTH_REFRESH_REUSE_DETECTED",
  "AUTH_PASSWORD_RESET_REQUESTED",
  "AUTH_PASSWORD_RESET_COMPLETED",
  "AUTH_EMAIL_VERIFIED",
  "USER_CREATED",
  "USER_UPDATED",
  "USER_DELETED",
  "USER_ROLE_CHANGED",
  "USER_ACTIVATION_TOGGLED",
  "USER_PASSWORD_RESET",
  "USER_FORCE_LOGOUT",
];

export default function AuditLogPage() {
  const [action, setAction] = useState("ALL");
  const [actor, setActor] = useState<User | null>(null);
  const [entityType, setEntityType] = useState("");
  const [entityId, setEntityId] = useState("");
  const [status, setStatus] = useState<AuditStatus | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const filters = useMemo(
    () => ({
      ...(action === "ALL" ? {} : { action }),
      ...(actor ? { actorId: actor._id } : {}),
      ...(entityType.trim() ? { entityType: entityType.trim() } : {}),
      ...(entityId.trim() ? { entityId: entityId.trim() } : {}),
      ...(status === "ALL" ? {} : { status }),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    }),
    [action, actor, entityType, entityId, status, fromDate, toDate],
  );

  const audit = useAuditLogs(filters);
  const logs = audit.data?.pages.flatMap((page) => page.items) ?? [];

  if (audit.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Authentication and user-administration audit trail."
      />

      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All actions</SelectItem>
            {actions.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <UserSearchSelect
          selected={actor}
          onChange={setActor}
          placeholder="Filter by actor"
        />

        <Input
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          placeholder="Entity type"
        />
        <Input
          value={entityId}
          onChange={(event) => setEntityId(event.target.value)}
          placeholder="Entity id"
        />

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as AuditStatus | "ALL")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="SUCCESS">Success</SelectItem>
            <SelectItem value="FAILURE">Failure</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </div>

      {audit.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(audit.error, "Failed to load audit logs.")}
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="w-14" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No audit entries match these filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                        <TableCell>
                          {log.actor?.name ?? log.actorId ?? "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.action}
                        </TableCell>
                        <TableCell>
                          {log.entityType}
                          {log.entityId ? ` / ${log.entityId}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              log.status === "FAILURE"
                                ? "destructive"
                                : "default"
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.ip ?? "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelected(log)}
                            aria-label="View audit detail"
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
              disabled={!audit.hasNextPage || audit.isFetchingNextPage}
              onClick={() => audit.fetchNextPage()}
            >
              {audit.isFetchingNextPage
                ? "Loading…"
                : audit.hasNextPage
                  ? "Load more"
                  : "No more entries"}
            </Button>
          </div>
        </>
      )}

      {selected && (
        <AuditDetailDialog
          log={selected}
          actorName={
            selected.actor?.name ?? selected.actorId ?? "System"
          }
          onOpenChange={(open) => !open && setSelected(null)}
        />
      )}
    </div>
  );
}
