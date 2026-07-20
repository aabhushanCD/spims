// UserStatusBadge.tsx

import { Badge } from "@/components/ui/badge";

interface Props {
  isActive: boolean;
}

export function UserStatusBadge({ isActive }: Props) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
