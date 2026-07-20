import { Badge } from "@/components/ui/badge";
import type { Batch } from "../types/batch";

interface Props {
  batch: Batch;
}

export function BatchStatusBadge({ batch }: Props) {
  if (batch.isExpired) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (batch.quantityRemaining === 0) {
    return <Badge variant="secondary">Sold Out</Badge>;
  }

  if (batch.quantityRemaining <= batch.quantityReceived * 0.2) {
    return <Badge variant="outline">Low Stock</Badge>;
  }

  return <Badge>Available</Badge>;
}
