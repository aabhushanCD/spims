// ReorderRecommendationCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ReorderRecommendationList } from "./ReorderRecommendationList";
import type { ReorderRecommendation } from "../types/smart.types";

interface Props {
  recommendations: ReorderRecommendation[];
}

export function ReorderRecommendationCard({ recommendations }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reorder Recommendations</CardTitle>
      </CardHeader>

      <CardContent>
        <ReorderRecommendationList recommendations={recommendations} />
      </CardContent>
    </Card>
  );
}
