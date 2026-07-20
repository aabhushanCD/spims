// UserRoleBadge.tsx

import { Badge } from "@/components/ui/badge";

type UserRole = "owner" | "inventory_manager" | "pharmacist";
interface Props {
  role: UserRole;
}

export function UserRoleBadge({ role }: Props) {
  const roleLabel = {
    owner: "Owner",
    inventory_manager: "Inventory Manager",
    pharmacist: "Pharmacist",
  };

  return <Badge variant="outline">{roleLabel[role]}</Badge>;
}
