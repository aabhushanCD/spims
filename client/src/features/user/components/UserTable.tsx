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

interface Props {
  users: any;

  onEdit: (id: string) => void;

  onDelete: (id: string) => void;
}

export function UserTable({ users, onEdit, onDelete }: Props) {
    
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
          {users?.map((user: any) => (
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
                <UserActions
                  id={user._id}

                  onEdit={onEdit}

                  onDelete={() => onDelete(user._id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
