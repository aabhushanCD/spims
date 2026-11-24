import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { UserRoleBadge } from "./UserRoleBadge";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserActions } from "./UserActions";
import RelativeTime from "@/components/common/RelativeTime";
import { canActOnUser } from "../lib/userPermissions";
import type { User } from "../types/user.types";

interface Props {
  users: User[];
  canManage: boolean;
  currentUserId?: string;
  onEdit: (user: User) => void;
  onChangeRole: (user: User) => void;
  onResetPassword: (user: User) => void;
  onForceLogout: (user: User) => void;
  onToggleActive: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserTable({
  users,
  canManage,
  currentUserId,
  onEdit,
  onChangeRole,
  onResetPassword,
  onForceLogout,
  onToggleActive,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Verified</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last login</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-20 text-center">
                No users found.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user._id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <UserRoleBadge role={user.role} />
                </TableCell>
                <TableCell>{user.emailVerified ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <UserStatusBadge isActive={user.isActive} />
                </TableCell>
                <TableCell>
                  {user.lastLogin ? (
                    <RelativeTime value={user.lastLogin} />
                  ) : (
                    "Never"
                  )}
                </TableCell>
                <TableCell>
                  {canManage ? (
                    <UserActions
                      user={user}
                      isSelf={!canActOnUser(currentUserId, user._id)}
                      onEdit={onEdit}
                      onChangeRole={onChangeRole}
                      onResetPassword={onResetPassword}
                      onForceLogout={onForceLogout}
                      onToggleActive={onToggleActive}
                      onDelete={onDelete}
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Read only
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
