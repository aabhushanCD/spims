import { useDeferredValue, useState } from "react";

import { useAuth } from "@/features/auth/context/authContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getApiErrorMessage } from "@/api/getApiErrorMessage";
import { UserStats } from "../components/UserStats";
import { UserTable } from "../components/UserTable";
import { UserToolbar } from "../components/UserToolbar";
import UserEditDialog from "../components/UserEditDialog";
import UserRoleDialog from "../components/UserRoleDialog";
import {
  useDeleteUser,
  useForceLogoutUser,
  useResetUserPassword,
  useToggleUserActivation,
} from "../hooks/useMutateUser";
import { useUserList, useUserStats } from "../hooks/useUser";
import { canManageUsers } from "../lib/userPermissions";
import type { User, UserRole } from "../types/user.types";

type ConfirmAction = "delete" | "force-logout" | "toggle" | "reset-password";

const confirmCopy: Record<
  ConfirmAction,
  { title: string; description: string; action: string }
> = {
  delete: {
    title: "Permanently delete this user?",
    description:
      "This removes the account and revokes its sessions. This cannot be undone.",
    action: "Delete user",
  },
  "force-logout": {
    title: "Force logout this user?",
    description:
      "Every active session and access token for this user will be revoked.",
    action: "Force logout",
  },
  toggle: {
    title: "Change user activation?",
    description:
      "Deactivating a user immediately revokes their sessions. Reactivating restores access.",
    action: "Confirm",
  },
  "reset-password": {
    title: "Send a password reset link?",
    description:
      "The user receives a one-time reset link. Their current sessions are revoked.",
    action: "Send reset link",
  },
};

const UserPage = () => {
  const { currentUser } = useAuth();
  const canManage = canManageUsers(currentUser?.role);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | "ALL">("ALL");
  const [status, setStatus] = useState<"ALL" | "active" | "inactive">("ALL");
  const deferredSearch = useDeferredValue(search);

  const users = useUserList({
    ...(deferredSearch ? { search: deferredSearch } : {}),
    ...(role === "ALL" ? {} : { role }),
    ...(status === "ALL" ? {} : { isActive: status === "active" }),
  });
  const stats = useUserStats();

  const toggleActivation = useToggleUserActivation();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();
  const forceLogout = useForceLogoutUser();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleUser, setRoleUser] = useState<User | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    action: ConfirmAction;
    user: User;
  } | null>(null);

  const list = users.data?.pages.flatMap((page) => page.items) ?? [];

  if (users.isLoading) {
    return <LoadingSpinner />;
  }

  const runConfirm = () => {
    if (!confirmTarget) return;
    const { action, user } = confirmTarget;

    switch (action) {
      case "delete":
        deleteUser.mutate(user._id, {
          onSuccess: () => setConfirmTarget(null),
        });
        break;
      case "force-logout":
        forceLogout.mutate(user._id, {
          onSuccess: () => setConfirmTarget(null),
        });
        break;
      case "toggle":
        toggleActivation.mutate(user._id, {
          onSuccess: () => setConfirmTarget(null),
        });
        break;
      case "reset-password":
        resetPassword.mutate(user._id, {
          onSuccess: () => setConfirmTarget(null),
        });
        break;
    }
  };

  const isPending =
    deleteUser.isPending ||
    forceLogout.isPending ||
    toggleActivation.isPending ||
    resetPassword.isPending;

  return (
    <div className="space-y-6">
      <UserStats
        total={stats.data?.total ?? 0}
        active={stats.data?.active ?? 0}
        inactive={stats.data?.inactive ?? 0}
      />

      <UserToolbar
        search={search}
        role={role}
        status={status}
        canManage={canManage}
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onStatusChange={setStatus}
      />

      {users.isError ? (
        <div className="text-destructive rounded-lg border p-6 text-center text-sm">
          {getApiErrorMessage(users.error, "Failed to load users.")}
        </div>
      ) : (
        <>
          <UserTable
            users={list}
            canManage={canManage}
            currentUserId={currentUser?._id}
            onEdit={setEditingUser}
            onChangeRole={setRoleUser}
            onResetPassword={(user) =>
              setConfirmTarget({ action: "reset-password", user })
            }
            onForceLogout={(user) =>
              setConfirmTarget({ action: "force-logout", user })
            }
            onToggleActive={(user) =>
              setConfirmTarget({ action: "toggle", user })
            }
            onDelete={(user) => setConfirmTarget({ action: "delete", user })}
          />

          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={!users.hasNextPage || users.isFetchingNextPage}
              onClick={() => users.fetchNextPage()}
            >
              {users.isFetchingNextPage
                ? "Loading…"
                : users.hasNextPage
                  ? "Load more"
                  : "No more users"}
            </Button>
          </div>
        </>
      )}

      {editingUser && (
        <UserEditDialog
          user={editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
        />
      )}

      {roleUser && (
        <UserRoleDialog
          user={roleUser}
          onOpenChange={(open) => !open && setRoleUser(null)}
        />
      )}

      <AlertDialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget ? confirmCopy[confirmTarget.action].title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget
                ? `${confirmTarget.user.name}: ${confirmCopy[confirmTarget.action].description}`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={
                confirmTarget?.action === "delete" ||
                confirmTarget?.action === "force-logout"
                  ? "destructive"
                  : "default"
              }
              disabled={isPending}
              onClick={runConfirm}
            >
              {confirmTarget ? confirmCopy[confirmTarget.action].action : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserPage;
