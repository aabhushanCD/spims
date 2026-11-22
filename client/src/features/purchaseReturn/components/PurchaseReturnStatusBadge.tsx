import { Badge } from "@/components/ui/badge";
import type { PurchaseReturnStatus } from "../types/purchaseReturn.types";

const variants: Record<
  PurchaseReturnStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  COMPLETED: "default",
};

export default function PurchaseReturnStatusBadge({
  status,
}: {
  status: PurchaseReturnStatus;
}) {
  return <Badge variant={variants[status]}>{status}</Badge>;
}
