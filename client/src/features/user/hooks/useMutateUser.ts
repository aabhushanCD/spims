import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/user.service";
import { toast } from "react-toastify";

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
    mutationFn: userService.updateUser,
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
    mutationFn: userService.changeRole,
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
