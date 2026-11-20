import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import AuthCard from "../components/AuthCard";
import AuthLayout from "../components/AuthLayout";
import AuthStatus from "../components/AuthStatus";
import PasswordInput from "../components/PasswordInput";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "../schema/resetPassword.schema";
import { useResetPassword } from "../hooks/useResetPassword";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(values: ResetPasswordFormData) {
    resetPassword.mutate({
      token,
      password: values.password,
    });
  }

  if (!token) {
    return (
      <AuthLayout>
        <AuthCard>
          <AuthStatus
            icon={<ShieldAlert className="h-8 w-8" />}
            tone="error"
            title="Invalid reset link"
            description="This link is missing its reset token. Request a new password reset email to continue."
          >
            <Button
              asChild
              className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          </AuthStatus>
        </AuthCard>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthCard>
        {resetPassword.isSuccess ? (
          <AuthStatus
            icon={<CheckCircle2 className="h-8 w-8" />}
            tone="success"
            title="Password updated"
            description="Your password has been reset and all devices have been signed out. Sign in with your new password."
          >
            <Button
              asChild
              className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Link to="/login">Sign in</Link>
            </Button>
          </AuthStatus>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold">Set a new password</h1>
              <p className="text-muted-foreground mt-2">
                Choose a strong password you have not used before.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="reset-password"
                >
                  New password
                </label>
                <PasswordInput
                  id="reset-password"
                  className="h-12"
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="reset-confirm-password"
                >
                  Confirm new password
                </label>
                <PasswordInput
                  id="reset-confirm-password"
                  className="h-12"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  {...form.register("confirmPassword")}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={resetPassword.isPending}
              >
                {resetPassword.isPending && (
                  <Loader2 className="mr-2 animate-spin" />
                )}
                Reset password
              </Button>

              <p className="text-muted-foreground text-center text-xs">
                Remembered it?{" "}
                <Link
                  to="/login"
                  className="font-medium text-emerald-600 hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
