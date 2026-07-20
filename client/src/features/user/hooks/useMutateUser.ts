import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { toast } from "react-toastify";
import type { User } from "../types/user.types";

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: Partial<User>;
    }) => userService.updateUser(userId, userData),
    onMutate: () => {
      toast.info("Updating user...");
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useChangeRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: User["role"];
    }) => userService.changeRole(userId, newRole),
    onMutate: () => {
      toast.info("Changing user role...");
    },
    onSuccess: () => {
      toast.success("User role changed successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useToggleUserActivation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userService.toggleUserActivation,

    onSuccess: () => {
      toast.success("User activation toggled successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
