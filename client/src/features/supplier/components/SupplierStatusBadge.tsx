import { Badge } from "@/components/ui/badge";

interface Props {
  active: boolean;
}

export default function SupplierStatusBadge({ active }: Props) {
  return (
    <Badge variant={active ? "default" : "secondary"}>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}
