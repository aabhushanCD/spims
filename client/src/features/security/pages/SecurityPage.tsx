import { LogOut, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

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
import { useAuth } from "@/features/auth/context/authContext";
import { useLogoutAllSessions } from "../hooks/useLogoutAllSessions";
import { useRevokeSession, useSessions } from "../hooks/useSessions";
import SessionList from "../components/SessionList";
import type { SessionSummary } from "../types/session.types";

export default function SecurityPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const sessionsQuery = useSessions();
  const revokeSession = useRevokeSession();
  const logoutAll = useLogoutAllSessions();

  const sessions = sessionsQuery.data ?? [];
  const otherSessions = sessions.filter((session) => !session.isCurrent);

  const handleRevoke = (session: SessionSummary) => {
    revokeSession.mutate(session.id, {
      onSuccess: () => {
        if (session.isCurrent) {
          setCurrentUser(null);
          navigate("/login", { replace: true });
        }
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Security
              </h1>
              <p className="text-muted-foreground text-sm">
                Review and revoke devices that are signed in to your account.
              </p>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              disabled={otherSessions.length === 0 || logoutAll.isPending}
            >
              <LogOut className="h-4 w-4" />
              Sign out all devices
            </Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Sign out every device?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This revokes all active sessions, including this one. You
                will need to sign in again on every device.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => logoutAll.mutate()}
              >
                Sign out everywhere
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Active sessions
          </p>
          <p className="mt-1 text-2xl font-bold">{sessions.length}</p>
        </div>
        <div className="bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Other devices
          </p>
          <p className="mt-1 text-2xl font-bold">
            {otherSessions.length}
          </p>
        </div>
        <div className="bg-card rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Session policy
          </p>
          <p className="mt-1 text-sm font-semibold">
            Rotating refresh tokens
          </p>
        </div>
      </div>

      <SessionList
        sessions={sessions}
        isLoading={sessionsQuery.isLoading}
        isError={sessionsQuery.isError}
        onRevoke={handleRevoke}
        revokingId={
          revokeSession.isPending ? revokeSession.variables : undefined
        }
      />

      <p className="text-muted-foreground text-xs leading-relaxed">
        Device names and approximate locations are derived from the browser
        user agent and the network headers supplied by your proxy or hosting
        provider. Location may show as “Unknown” when those headers are not
        available.
      </p>
    </div>
  );
}
