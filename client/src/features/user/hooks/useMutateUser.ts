import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { userService, type UpdateUserInput } from "../services/user.service";
import type { User, UserRole } from "../types/user.types";
import { userKeys } from "./useUser";

function useInvalidateUsers() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };
}

export const useCreateUser = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      toast.success("User created successfully");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to create user"));
    },
  });
};

export const useUpdateUser = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({
      userId,
      userData,
    }: {
      userId: string;
      userData: UpdateUserInput;
    }) => userService.updateUser(userId, userData),
    onSuccess: () => {
      toast.success("User updated successfully");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update user"));
    },
  });
};

export const useChangeRole = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: ({
      userId,
      newRole,
    }: {
      userId: string;
      newRole: UserRole;
    }) => userService.changeRole(userId, newRole),
    onSuccess: () => {
      toast.success("User role changed; sessions were revoked");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to change user role"));
    },
  });
};

export const useToggleUserActivation = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: userService.toggleUserActivation,
    onSuccess: () => {
      toast.success("User activation updated");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update user activation"));
    },
  });
};

export const useDeleteUser = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      toast.success("User permanently deleted");
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete user"));
    },
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: userService.resetUserPassword,
    onSuccess: (result) => {
      toast.success(result.message);
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to send password reset link"),
      );
    },
  });
};

export const useForceLogoutUser = () => {
  const invalidate = useInvalidateUsers();

  return useMutation({
    mutationFn: userService.forceLogout,
    onSuccess: (result) => {
      toast.success(result.message);
      invalidate();
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to revoke user sessions"));
    },
  });
};

export type { User };
