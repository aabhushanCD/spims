// UserTable.tsx

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
import type { User } from "@/features/auth/context/authContext";

interface Props {
  users?: User[];
  canManage?: boolean;
  onEdit?: (id: string) => void;

  onDelete: (id: string) => void;
}

export function UserTable({
  users,
  canManage = false,
  onEdit,
  onDelete,
}: Props) {
    
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Email</TableHead>

            <TableHead>Role</TableHead>

            <TableHead>Status</TableHead>

            <TableHead></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users?.map((user) => (
            <TableRow key={user._id}>
              <TableCell className="font-medium">{user.name}</TableCell>

              <TableCell>{user.email}</TableCell>

              <TableCell>
                <UserRoleBadge role={user.role} />
              </TableCell>

              <TableCell>
                <UserStatusBadge isActive={user.isActive} />
              </TableCell>

              <TableCell>
                {canManage ? (
                  <UserActions
                    id={user._id}
                    onEdit={onEdit}
                    onDelete={() => onDelete(user._id)}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Read only
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
