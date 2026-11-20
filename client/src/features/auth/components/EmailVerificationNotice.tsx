import { MailWarning } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useResendVerification } from "../hooks/useResendVerification";

export default function EmailVerificationNotice({
  email,
}: {
  email: string;
}) {
  const resend = useResendVerification();

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/60 dark:bg-amber-950/40">
      <div className="flex items-start gap-3">
        <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

        <div className="space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Verify your email before signing in
          </p>
          <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
            We sent a verification link to{" "}
            <span className="font-medium">
              {email || "your email address"}
            </span>
            . Check your inbox and spam folder.
          </p>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-amber-300 bg-transparent text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-900/40"
            disabled={!email || resend.isPending}
            onClick={() => resend.mutate(email)}
          >
            {resend.isPending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
