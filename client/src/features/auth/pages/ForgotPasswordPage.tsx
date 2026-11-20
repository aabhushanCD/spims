import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthCard from "../components/AuthCard";
import AuthLayout from "../components/AuthLayout";
import AuthStatus from "../components/AuthStatus";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../schema/forgotPassword.schema";
import { useForgotPassword } from "../hooks/useForgotPassword";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [submittedEmail, setSubmittedEmail] = useState("");
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordFormData) {
    forgotPassword.mutate(values.email, {
      onSuccess: () => setSubmittedEmail(values.email),
    });
  }

  return (
    <AuthLayout>
      <AuthCard>
        {forgotPassword.isSuccess ? (
          <AuthStatus
            icon={<MailCheck className="h-8 w-8" />}
            tone="success"
            title="Check your email"
            description={`If an account exists for ${submittedEmail}, a password reset link has been sent. The link expires in 30 minutes.`}
          >
            <div className="space-y-3">
              <Button
                asChild
                className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
              >
                <Link to="/login">Back to sign in</Link>
              </Button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                onClick={() => forgotPassword.reset()}
              >
                Use a different email
              </button>
            </div>
          </AuthStatus>
        ) : (
          <>
            <div className="mb-8">
              <Link
                to="/login"
                className="text-muted-foreground hover:text-foreground mb-5 inline-flex items-center gap-2 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
              <h1 className="text-3xl font-bold">Forgot password?</h1>
              <p className="text-muted-foreground mt-2">
                Enter your account email and we will send you a secure reset
                link.
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="forgot-email"
                >
                  Email
                </label>
                <Input
                  id="forgot-email"
                  className="h-12"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending && (
                  <Loader2 className="mr-2 animate-spin" />
                )}
                Send reset link
              </Button>
            </form>

            <p className="text-muted-foreground mt-5 text-center text-xs leading-relaxed">
              For security, we show the same confirmation whether or not the
              email is registered.
            </p>
          </>
        )}
      </AuthCard>
    </AuthLayout>
  );
}
