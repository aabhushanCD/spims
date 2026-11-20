import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  resendVerificationSchema,
  type ResendVerificationFormData,
} from "../schema/forgotPassword.schema";
import { useResendVerification } from "../hooks/useResendVerification";

export default function ResendVerificationForm({
  initialEmail = "",
}: {
  initialEmail?: string;
}) {
  const resend = useResendVerification();
  const [sent, setSent] = useState(false);
  const form = useForm<ResendVerificationFormData>({
    resolver: zodResolver(resendVerificationSchema),
    defaultValues: { email: initialEmail },
  });

  function onSubmit(values: ResendVerificationFormData) {
    resend.mutate(values.email, {
      onSuccess: () => setSent(true),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <div className="space-y-2 text-left">
        <label className="text-sm font-medium" htmlFor="resend-email">
          Email address
        </label>
        <Input
          id="resend-email"
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

      {sent && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-left text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          If the account still needs verification, a new link has been sent.
        </p>
      )}

      <Button
        type="submit"
        className="h-11 w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={resend.isPending}
      >
        {resend.isPending && (
          <Loader2 className="mr-2 animate-spin" />
        )}
        Send verification email
      </Button>
    </form>
  );
}
