import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import type { AuditLog } from "../types/audit.types";

interface Props {
  log: AuditLog;
  actorName: string;
  onOpenChange: (open: boolean) => void;
}

export default function AuditDetailDialog({
  log,
  actorName,
  onOpenChange,
}: Props) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{log.action}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Detail label="Time" value={formatDateTime(log.createdAt)} />
          <Detail label="Status" value={log.status} />
          <Detail label="Actor" value={`${actorName} (${log.actorRole ?? "-"})`} />
          <Detail label="Entity" value={`${log.entityType} / ${log.entityId ?? "-"}`} />
          <Detail label="IP" value={log.ip ?? "-"} />
          <Detail label="Request ID" value={log.requestId ?? "-"} />
          <div className="sm:col-span-2">
            <Detail label="User agent" value={log.userAgent ?? "-"} />
          </div>
        </div>

        <div>
          <p className="text-muted-foreground mb-1 text-xs">Metadata</p>
          <pre className="max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
            {JSON.stringify(log.metadata ?? {}, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="break-all">{value}</p>
    </div>
  );
}
