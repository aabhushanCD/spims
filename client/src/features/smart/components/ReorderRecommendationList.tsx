// ReorderRecommendationList.tsx

import { ScrollArea } from "@/components/ui/scroll-area";

import { ReorderRecommendationItem } from "./ReorderRecommendationItem";
import type { ReorderRecommendation } from "../types/smart.types";

interface Props {
  recommendations: ReorderRecommendation[];
}

export function ReorderRecommendationList({ recommendations }: Props) {
  return (
    <ScrollArea className="h-105">
      <div className="space-y-4">
        {recommendations?.map((item) => (
          <ReorderRecommendationItem key={item._id} recommendation={item} />
        ))}
      </div>
    </ScrollArea>
  );
}
