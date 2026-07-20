import { Badge } from "@/components/ui/badge";

interface Props {
  expiryDate: string;
}

export function BatchExpiryBadge({ expiryDate }: Props) {
  const today = new Date();

  const expiry = new Date(expiryDate);

  const diffTime = expiry.getTime() - today.getTime();

  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return <Badge variant="destructive">Expired</Badge>;
  }

  if (daysLeft <= 30) {
    return <Badge variant="destructive">{daysLeft} days left</Badge>;
  }

  if (daysLeft <= 90) {
    return <Badge variant="outline">{daysLeft} days left</Badge>;
  }

  return <Badge>{daysLeft} days left</Badge>;
}
