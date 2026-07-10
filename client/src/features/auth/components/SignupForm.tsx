import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { signupSchema, type SignupFormData } from "../schema/signup.schema";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRegister } from "../hooks/useRegister";
import { useNavigate } from "react-router";

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
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
    console.log(values);
    signup.mutate({
      email: values.email,
      name: values.name,
      password: values.password,
      role: values.role,
      confirmPassword: values.confirmPassword,
    });

    // signup api here
  }

  return (
    <Card
      className="w-full max-w-md
                  rounded-3xl
                  border-0
                  bg-white/90
                  shadow-2xl
                  backdrop-blur-xl
                  "
    >
      <CardContent className="p-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Account</h1>

          <p className="mt-2 text-muted-foreground">
            Join SPIMS and manage pharmacy smarter.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          {/* Name */}

          <div>
            <label className="text-sm font-medium">Full Name</label>

            <Input
              className="mt-2 h-12"
              placeholder="John Smith"
              {...form.register("name")}
            />

            <p className="text-sm text-red-500">
              {form.formState.errors.name?.message}
            </p>
          </div>

          {/* Email */}

          <div>
            <label className="text-sm font-medium">Email</label>

            <Input
              className="mt-2 h-12"
              placeholder="admin@spims.com"
              {...form.register("email")}
            />

            <p className="text-sm text-red-500">
              {form.formState.errors.email?.message}
            </p>
          </div>

          {/* Role */}

          <div>
            <label className="text-sm font-medium">Role</label>

            <Select
              defaultValue="pharmacist"
              onValueChange={(value) => {
                form.setValue("role", value as SignupFormData["role"]);
              }}
            >
              <SelectTrigger className="mt-2 h-12">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>

                <SelectItem value="pharmacist">Pharmacist</SelectItem>

                <SelectItem value="inventory_manager">
                  Inventory Manager
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password */}

          <div>
            <label className="text-sm font-medium">Password</label>

            <div className="relative mt-2">
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
"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <p className="text-sm text-red-500">
              {form.formState.errors.password?.message}
            </p>
          </div>

          {/* Confirm Password */}

          <div>
            <label className="text-sm font-medium">Confirm Password</label>

            <Input
              className="mt-2 h-12"
              type="password"
              placeholder="••••••••"
              {...form.register("confirmPassword")}
            />

            <p className="text-sm text-red-500">
              {form.formState.errors.confirmPassword?.message}
            </p>
          </div>

          <Button
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700 "
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 animate-spin" />
            )}
            Create Account
          </Button>
          <Button
            className="h-12 w-full bg-muted-foreground hover:bg-muted-foreground/90 "
            onClick={() => navigate("/login")}
          >
            Already have an account? Log in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
