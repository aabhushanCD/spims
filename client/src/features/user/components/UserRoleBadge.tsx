// UserRoleBadge.tsx

import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

type UserRole = "owner" | "inventory_manager" | "pharmacist";
interface Props {
  role: UserRole;
}

export function UserRoleBadge({ role }: Props) {
  const { t } = useTranslation();

  return <Badge variant="outline">{t(`role.${role}`)}</Badge>;
}
