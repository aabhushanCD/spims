import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="max-w-xs"
        placeholder={t("user.searchUsers")}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <Select
        value={role}
        onValueChange={(value) => onRoleChange(value as UserRole | "ALL")}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t("user.role")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("user.allRoles")}</SelectItem>
          <SelectItem value="owner">{t("role.owner")}</SelectItem>
          <SelectItem value="inventory_manager">
            {t("role.inventory_manager")}
          </SelectItem>
          <SelectItem value="pharmacist">
            {t("role.pharmacist")}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(value) =>
          onStatusChange(value as "ALL" | "active" | "inactive")
        }
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t("user.status")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">{t("user.allStatuses")}</SelectItem>
          <SelectItem value="active">{t("user.active")}</SelectItem>
          <SelectItem value="inactive">{t("user.inactive")}</SelectItem>
        </SelectContent>
      </Select>

      {canManage ? <UserDialog /> : null}
    </div>
  );
}
