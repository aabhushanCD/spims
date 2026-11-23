import { Link } from "react-router";
import { Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

import type { TopSellingRow } from "../types/dashboard";

interface Props {
  topSelling: TopSellingRow[];
}

export default function TopSellingCard({ topSelling }: Props) {
  const items = topSelling ?? [];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Top selling medicines</CardTitle>

        <CardDescription>By net units sold this year</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Trophy
              className="text-muted-foreground h-9 w-9"
              aria-hidden="true"
            />
            <p className="font-medium">No sales recorded yet</p>
            <p className="text-muted-foreground text-sm">
              Your best sellers will appear here after the first sales.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/sales">Create a sale</Link>
            </Button>
          </div>
        ) : (
          <ol className="divide-y">
            {items.map((item, index) => (
              <li
                key={item.medicineId}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="bg-muted text-muted-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.medicineName}
                  </p>

                  <p className="text-muted-foreground truncate text-xs">
                    {item.strength || "Strength not set"} ·{" "}
                    {item.totalQuantitySold.toLocaleString()} sold
                  </p>
                </div>

                <p
                  className="shrink-0 text-sm font-semibold"
                  title={formatCurrency(item.totalRevenue)}
                >
                  {formatCompactCurrency(item.totalRevenue)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/reports">Open reports</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
