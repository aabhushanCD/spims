import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import UserDialog from "./UserDialog";
import type { UserRole } from "../types/user.types";

interface Props {
  search: string;
  role: UserRole | "ALL";
  status: "ALL" | "active" | "inactive";
  canManage?: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRole | "ALL") => void;
  onStatusChange: (value: "ALL" | "active" | "inactive") => void;
}

export function UserToolbar({
  search,
  role,
  status,
  canManage = false,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="max-w-xs"
        placeholder="Search users..."
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <Select
        value={role}
        onValueChange={(value) => onRoleChange(value as UserRole | "ALL")}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All roles</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
          <SelectItem value="pharmacist">Pharmacist</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange(value as "ALL" | "active" | "inactive")
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {canManage ? <UserDialog /> : null}
    </div>
  );
}
