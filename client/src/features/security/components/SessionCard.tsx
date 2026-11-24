import {
  Clock,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Wifi,
} from "lucide-react";
import RelativeTime from "@/components/common/RelativeTime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { SessionSummary } from "../types/session.types";

function DeviceIcon({ session }: { session: SessionSummary }) {
  const label = `${session.device} ${session.os}`.toLowerCase();

  if (
    label.includes("iphone") ||
    label.includes("android") ||
    label.includes("mobile")
  ) {
    return <Smartphone className="h-5 w-5" />;
  }

  if (label.includes("ipad") || label.includes("tablet")) {
    return <Tablet className="h-5 w-5" />;
  }

  return <Monitor className="h-5 w-5" />;
}

export default function SessionCard({
  session,
  onRevoke,
  isRevoking,
}: {
  session: SessionSummary;
  onRevoke: (session: SessionSummary) => void;
  isRevoking: boolean;
}) {
  return (
    <div className="bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <DeviceIcon session={session} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold">
                {session.device || "Unknown device"}
              </h3>
              {session.isCurrent && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  This device
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground text-sm">
              {session.browser} on {session.os}
            </p>

            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                {session.ip}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {session.location}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                {session.browser}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Active <RelativeTime value={session.lastUsedAt} />
              </span>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0"
              disabled={isRevoking}
            >
              <Trash2 className="h-4 w-4" />
              Revoke
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {session.isCurrent
                  ? "Sign out this device?"
                  : "Revoke this session?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {session.isCurrent
                  ? "You will be signed out of this browser and redirected to the login page."
                  : `The session on ${session.device} will be signed out immediately.`}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => onRevoke(session)}
              >
                {session.isCurrent ? "Sign out" : "Revoke session"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
