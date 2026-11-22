// ReorderSummary.tsx

import { ClipboardList, PackageMinus, Target } from "lucide-react";

import { Card } from "@/components/ui/card";

interface Props {
  total: number;
  pending: number;
  highConfidence: number;
}

export function ReorderSummary({
  total,
  pending,
  highConfidence,
}: Props) {
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
        <Target className="mb-2 text-emerald-600" />

        <p className="text-muted-foreground text-sm">High confidence</p>

        <h2 className="text-2xl font-bold">{highConfidence}</h2>
      </Card>
    </div>
  );
}
