import { Badge } from "@/components/ui/badge";
import type { ReturnStatus } from "../types/return.types";

const variants: Record<
  ReturnStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  COMPLETED: "default",
  REVERSED: "destructive",
};

export default function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
