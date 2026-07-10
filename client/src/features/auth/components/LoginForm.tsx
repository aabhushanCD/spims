import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema, type LoginFormData } from "../schema/login.schema";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLogin } from "../hooks/useLogin";
import { useNavigate } from "react-router";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const navigate = useNavigate();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginFormData) {
    console.log("Form submitted with values:", values);
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });

    // login API here
  }

  return (
    <Card
      className="
      w-full 
      max-w-md
      rounded-3xl
      border-0
      bg-white/90
      shadow-2xl
      backdrop-blur-xl
      "
    >
      <CardContent className="p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome Back </h1>

          <p className="mt-2 text-muted-foreground">
            Sign in to continue managing your pharmacy.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>

            <Input
              className="h-12"
              placeholder="admin@spims.com"
              {...form.register("email")}
            />

            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>

            <div className="relative">
              <Input
                className="h-12 pr-12"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register("password")}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="
                absolute
                right-3
                top-3
                text-muted-foreground
                "
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {form.formState.errors.password && (
              <p className="text-sm text-red-500">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            className="
            h-12
            w-full
            bg-emerald-600
            hover:bg-emerald-700
            "
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            Sign In
          </Button>
          <Button
            className="h-12 w-full bg-muted-foreground hover:bg-muted-foreground/90"
            type="button"
            onClick={() => navigate("/signup")}
          >
            Don't have an account? Sign up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
