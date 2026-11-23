import {
  KeyRound,
  LogOut,
  MoreHorizontal,
  Pencil,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import type { User } from "../types/user.types";

interface Props {
  user: User;
  isSelf: boolean;
  onEdit: (user: User) => void;
  onChangeRole: (user: User) => void;
  onResetPassword: (user: User) => void;
  onForceLogout: (user: User) => void;
  onToggleActive: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserActions({
  user,
  isSelf,
  onEdit,
  onChangeRole,
  onResetPassword,
  onForceLogout,
  onToggleActive,
  onDelete,
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onEdit(user)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit profile
        </DropdownMenuItem>

        {!isSelf && (
          <>
            <DropdownMenuItem onClick={() => onChangeRole(user)}>
              <Shield className="mr-2 h-4 w-4" />
              Change role
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onResetPassword(user)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Reset password
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onForceLogout(user)}>
              <LogOut className="mr-2 h-4 w-4" />
              Force logout
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onToggleActive(user)}>
              {user.isActive ? (
                <UserX className="mr-2 h-4 w-4" />
              ) : (
                <UserCheck className="mr-2 h-4 w-4" />
              )}
              {user.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete user
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
