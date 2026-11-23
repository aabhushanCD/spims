import { ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "react-router";

import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReorderSummary } from "@/features/dashboard/types/dashboard";

import type { ReorderRecommendation } from "../types/smart.types";

interface Props {
  recommendations: ReorderRecommendation[];
  summary?: ReorderSummary;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function ReorderSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading reorder recommendations">
      {[0, 1, 2].map((row) => (
        <div key={row} className="space-y-2 border-b py-3 last:border-b-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ReorderRecommendationCard({
  recommendations,
  summary,
  isLoading = false,
  isError = false,
  onRetry,
}: Props) {
  const items = recommendations ?? [];
  const visible = items.slice(0, 5);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Reorder recommendations</CardTitle>

            <CardDescription>
              {summary
                ? `${summary.pendingCount.toLocaleString()} pending · ${summary.highConfidenceCount.toLocaleString()} high confidence · ${summary.totalSuggestedUnits.toLocaleString()} units suggested`
                : "Smart suggestions based on stock and demand"}
            </CardDescription>
          </div>

          {summary && summary.pendingCount > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {summary.pendingCount.toLocaleString()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && <ReorderSkeleton />}

        {!isLoading && isError && (
          <ErrorState
            message="Could not load reorder recommendations."
            onRetry={onRetry}
          />
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState
            title="No reorder recommendations"
            description="Stock levels are above their reorder points. New suggestions appear after the next demand calculation."
            action={
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/smart-reorders">
                  <ClipboardList aria-hidden="true" />
                  Review reorder settings
                </Link>
              </Button>
            }
          />
        )}

        {!isLoading && !isError && visible.length > 0 && (
          <ul className="divide-y">
            {visible.map((item) => (
              <li key={item._id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.medicineId.medicineName}
                    </p>

                    <p className="text-muted-foreground text-xs">
                      {item.medicineId.strength || "Strength not set"}
                    </p>
                  </div>

                  <Badge variant="secondary" className="shrink-0">
                    {Math.round(item.confidenceScore)}%
                  </Badge>
                </div>

                <div className="text-muted-foreground mt-2 flex items-center justify-between text-xs">
                  <span>Stock {item.currentStock.toLocaleString()}</span>
                  <span>
                    Suggested{" "}
                    <span className="text-foreground font-medium">
                      {item.suggestedQuantity.toLocaleString()}
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !isError && items.length > visible.length && (
          <p className="text-muted-foreground mt-3 text-xs">
            +{(items.length - visible.length).toLocaleString()} more pending
          </p>
        )}
      </CardContent>

      {!isLoading && !isError && items.length > 0 && (
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/smart-reorders">
              View all recommendations
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
