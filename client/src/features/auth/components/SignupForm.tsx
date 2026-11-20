import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupFormData } from "../schema/signup.schema";
import { useRegister } from "../hooks/useRegister";
import PasswordInput from "./PasswordInput";

export default function SignupForm() {
  const signup = useRegister();
  const navigate = useNavigate();
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "pharmacist",
    },
  });

  function onSubmit(values: SignupFormData) {
    signup.mutate({
      email: values.email,
      name: values.name,
      password: values.password,
      role: "pharmacist",
      confirmPassword: values.confirmPassword,
    });
  }

  return (
    <Card className="w-full max-w-md rounded-3xl border-0 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-card/95">
      <CardContent className="p-8 sm:p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Join SPIMS and manage pharmacy smarter.
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-name">
              Full Name
            </label>
            <Input
              id="signup-name"
              className="h-12"
              placeholder="John Smith"
              autoComplete="name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="signup-email">
              Email
            </label>
            <Input
              id="signup-email"
              className="h-12"
              placeholder="admin@spims.com"
              autoComplete="email"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="signup-password"
            >
              Password
            </label>
            <PasswordInput
              id="signup-password"
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
              htmlFor="signup-confirm-password"
            >
              Confirm Password
            </label>
            <PasswordInput
              id="signup-confirm-password"
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

          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs leading-relaxed text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            New accounts are created with the pharmacist role. An owner can
            change your role from the user-management dashboard. You will need
            to verify your email before signing in.
          </p>

          <Button
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={signup.isPending}
            type="submit"
          >
            {signup.isPending && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            Create Account
          </Button>

          <Button
            type="button"
            className="bg-muted-foreground hover:bg-muted-foreground/90 h-12 w-full"
            onClick={() => navigate("/login")}
          >
            Already have an account? Log in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
