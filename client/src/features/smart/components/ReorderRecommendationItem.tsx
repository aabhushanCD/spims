
import { AlertTriangle, Boxes, ShoppingCart } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ReorderStatusBadge } from "./ReorderStatusBadge";
import type { ReorderRecommendation } from "../types/smart.types";

interface Props {
  recommendation: ReorderRecommendation;
}

export function ReorderRecommendationItem({ recommendation }: Props) {
  return (
    <Card className="hover:bg-muted/30 p-4 transition-colors">
      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold">
            {recommendation.medicineId.medicineName}
          </h3>

          <p className="text-muted-foreground text-sm">
            {recommendation.medicineId.strength}
          </p>
        </div>

        <ReorderStatusBadge status={recommendation.status} />
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Boxes className="text-primary h-4 w-4" />

          <div>
            <p className="text-muted-foreground text-xs">Current Stock</p>

            <p className="font-semibold">{recommendation.currentStock}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary h-4 w-4" />

          <div>
            <p className="text-muted-foreground text-xs">Suggested Order</p>

            <p className="font-semibold">{recommendation.suggestedQuantity}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span>Confidence</span>

          <span>{recommendation.confidenceScore.toFixed(0)}%</span>
        </div>

        <div className="bg-muted mt-1 h-2 rounded">
          <div
            className="bg-primary h-2 rounded"
            style={{
              width: `${recommendation.confidenceScore}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <AlertTriangle className="mt-1 h-4 w-4 text-yellow-500" />

        <p className="text-muted-foreground text-sm">
          {recommendation.recommendationReason}
        </p>
      </div>
    </Card>
  );
}
