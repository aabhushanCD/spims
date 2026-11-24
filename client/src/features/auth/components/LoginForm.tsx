import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getApiErrorCode } from "@/lib/apiError";
import { loginSchema, type LoginFormData } from "../schema/login.schema";
import { useLogin } from "../hooks/useLogin";
import EmailVerificationNotice from "./EmailVerificationNotice";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
  const { t } = useTranslation();
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const needsVerification =
    getApiErrorCode(loginMutation.error) === "EMAIL_NOT_VERIFIED";

  function onSubmit(values: LoginFormData) {
    setEmail(values.email);
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-card/95">
      <CardContent className="p-8 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{t("auth.welcomeBack")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("auth.signInSubtitle")}
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="login-email">
              {t("auth.email")}
            </label>
            <Input
              id="login-email"
              className="h-12"
              placeholder="admin@spims.com"
              autoComplete="email"
              {...form.register("email", {
                onChange: (event) => setEmail(event.target.value),
              })}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                className="text-sm font-medium"
                htmlFor="login-password"
              >
                {t("auth.password")}
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <PasswordInput
              id="login-password"
              className="h-12"
              placeholder="••••••••"
              autoComplete="current-password"
              {...form.register("password")}
            />

            {form.formState.errors.password && (
              <p className="text-sm text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {needsVerification && (
            <EmailVerificationNotice email={email} />
          )}

          <Button
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loginMutation.isPending}
            type="submit"
          >
            {loginMutation.isPending && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            {t("auth.signIn")}
          </Button>

          <Button
            className="bg-muted-foreground hover:bg-muted-foreground/90 h-12 w-full"
            type="button"
            onClick={() => navigate("/signup")}
          >
            {t("auth.noAccount")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
