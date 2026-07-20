// ReorderStatusBadge.tsx

import { Badge } from "@/components/ui/badge";

interface Props {
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export function ReorderStatusBadge({ status }: Props) {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-green-600">Approved</Badge>;

    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;

    default:
      return <Badge variant="secondary">Pending</Badge>;
  }
}
