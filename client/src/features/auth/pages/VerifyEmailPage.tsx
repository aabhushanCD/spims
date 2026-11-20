import { useEffect, useRef } from "react";
import {
  CheckCircle2,
  Loader2,
  MailCheck,
  MailQuestion,
  XCircle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/apiError";
import AuthCard from "../components/AuthCard";
import AuthLayout from "../components/AuthLayout";
import AuthStatus from "../components/AuthStatus";
import ResendVerificationForm from "../components/ResendVerificationForm";
import { useVerifyEmail } from "../hooks/useVerifyEmail";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const sent = searchParams.get("sent") === "1";
  const { mutate, isPending, isSuccess, isError, error } =
    useVerifyEmail();
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) {
      return;
    }

    started.current = true;
    mutate(token);
  }, [token, mutate]);

  if (token) {
    return (
      <AuthLayout>
        <AuthCard>
          {isSuccess ? (
            <AuthStatus
              icon={<CheckCircle2 className="h-8 w-8" />}
              tone="success"
              title="Email verified"
              description="Your email address is confirmed. You can now sign in to SPIMS."
            >
              <Button
                asChild
                className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Link to="/login">Sign in</Link>
              </Button>
            </AuthStatus>
          ) : isError ? (
            <AuthStatus
              icon={<XCircle className="h-8 w-8" />}
              tone="error"
              title="Verification failed"
              description={getApiErrorMessage(
                error,
                "This verification link is invalid or has expired.",
              )}
            >
              <div className="space-y-4">
                <ResendVerificationForm initialEmail={email} />
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-foreground block text-center text-xs underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </AuthStatus>
          ) : (
            <AuthStatus
              icon={<Loader2 className="h-8 w-8 animate-spin" />}
              tone="info"
              title="Verifying your email"
              description={
                isPending
                  ? "Please wait while we confirm your address."
                  : "Preparing verification..."
              }
            />
          )}
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        {sent || email ? (
          <AuthStatus
            icon={<MailCheck className="h-8 w-8" />}
            tone="success"
            title="Check your inbox"
            description={`We sent a verification link${email ? ` to ${email}` : ""}. Open it to activate your account. The link expires in 24 hours.`}
          >
            <div className="space-y-4">
              <ResendVerificationForm initialEmail={email} />
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground block text-center text-xs underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </AuthStatus>
        ) : (
          <AuthStatus
            icon={<MailQuestion className="h-8 w-8" />}
            tone="info"
            title="Verify your email"
            description="Enter the email address you registered with and we will send a new verification link."
          >
            <div className="space-y-4">
              <ResendVerificationForm />
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground block text-center text-xs underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </AuthStatus>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
