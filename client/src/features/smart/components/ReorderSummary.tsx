// ReorderSummary.tsx

import { AlertTriangle, ClipboardList, PackageMinus } from "lucide-react";

import { Card } from "@/components/ui/card";

interface Props {
  total: number;
  pending: number;
  critical: number;
}

export function ReorderSummary({ total, pending, critical }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-4">
        <ClipboardList className="text-primary mb-2" />

        <p className="text-muted-foreground text-sm">Total Recommendations</p>

        <h2 className="text-2xl font-bold">{total}</h2>
      </Card>

      <Card className="p-4">
        <PackageMinus className="mb-2 text-yellow-500" />

        <p className="text-muted-foreground text-sm">Pending</p>

        <h2 className="text-2xl font-bold">{pending}</h2>
      </Card>

      <Card className="p-4">
        <AlertTriangle className="mb-2 text-red-500" />

        <p className="text-muted-foreground text-sm">Critical</p>

        <h2 className="text-2xl font-bold">{critical}</h2>
      </Card>
    </div>
  );
}
