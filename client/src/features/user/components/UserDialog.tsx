import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  signupSchema,
  type SignupFormData,
} from "@/features/auth/schema/signup.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateUser } from "../hooks/useMutateUser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UserDialog = () => {
  const [showPassword, setShowPassword] = useState(false);

  const createUser = useCreateUser();

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

  const onSubmit = async (values: SignupFormData) => {
    await createUser.mutate({
      name: values.name,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: values.role,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add User</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>
            Create a new pharmacy staff account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
                <SelectItem value="owner">Owner</SelectItem>

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
                className="absolute top-3 right-3"
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
            className="h-12 w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={createUser.isPending}
            type="submit"
          >
            {createUser.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create User
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
