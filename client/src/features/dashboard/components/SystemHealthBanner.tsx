import { AlertTriangle } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import RelativeTime from "@/components/common/RelativeTime";
import { useAuth } from "@/features/auth/context/authContext";
import { canAccess } from "@/lib/permissions";

import type { SystemHealthSummary } from "../types/dashboard";

interface Props {
  systemHealth: SystemHealthSummary;
}

export default function SystemHealthBanner({ systemHealth }: Props) {
  const { currentUser } = useAuth();

  if (systemHealth.staleJobCount === 0) {
    return null;
  }

  const visibleJobs = systemHealth.staleJobs.slice(0, 3);
  const canViewAudit = canAccess(currentUser?.role, ["owner"]);

  return (
    <div
      role="alert"
      className="border-amber-300 bg-amber-50 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-500/30 dark:bg-amber-500/10"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />

        <div>
          <p className="font-medium">
            {systemHealth.staleJobCount} background{" "}
            {systemHealth.staleJobCount === 1 ? "job needs" : "jobs need"}{" "}
            attention
          </p>

          <p className="text-muted-foreground text-sm">
            {visibleJobs.map((job, index) => (
              <span key={`${job.jobName}-${job.startedAt}`}>
                {index > 0 ? " · " : ""}
                {job.jobName} (<RelativeTime value={job.startedAt} />,{" "}
                {job.status})
              </span>
            ))}
            {systemHealth.staleJobs.length > visibleJobs.length
              ? ` · +${systemHealth.staleJobs.length - visibleJobs.length} more`
              : ""}
          </p>
        </div>
      </div>

      {canViewAudit && (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link to="/audit">View audit log</Link>
        </Button>
      )}
    </div>
  );
}
