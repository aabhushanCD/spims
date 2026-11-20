import { ShieldOff } from "lucide-react";

import SessionCard from "./SessionCard";
import type { SessionSummary } from "../types/session.types";

export default function SessionList({
  sessions,
  isLoading,
  isError,
  onRevoke,
  revokingId,
}: {
  sessions: SessionSummary[];
  isLoading: boolean;
  isError: boolean;
  onRevoke: (session: SessionSummary) => void;
  revokingId?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="bg-card h-28 animate-pulse rounded-2xl border"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/60 dark:bg-red-950/40">
        <p className="text-sm text-red-700 dark:text-red-300">
          Could not load your sessions. Refresh the page to try again.
        </p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border p-10 text-center">
        <ShieldOff className="text-muted-foreground mx-auto h-10 w-10" />
        <h3 className="mt-3 font-semibold">No active sessions</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Sessions appear here after you sign in on a device.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onRevoke={onRevoke}
          isRevoking={revokingId === session.id}
        />
      ))}
    </div>
  );
}
