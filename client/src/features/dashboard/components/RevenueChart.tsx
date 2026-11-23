import { useMemo } from "react";
import { Link } from "react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { monthNames } from "@/features/dashboard/data/monthName";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

import {
  bestRevenueMonth,
  hasRevenue,
  totalRevenue,
} from "../lib/dashboardState";
import type { MonthlySalesPoint } from "../types/dashboard";

interface Props {
  revenueTrend: MonthlySalesPoint[];
}

export default function RevenueChart({ revenueTrend }: Props) {
  const chartData = useMemo(
    () =>
      revenueTrend.map((item) => ({
        month: monthNames[item.month - 1],
        revenue: item.total,
        sales: item.count,
      })),
    [revenueTrend],
  );

  const hasData = hasRevenue(revenueTrend);
  const total = totalRevenue(revenueTrend);
  const best = bestRevenueMonth(revenueTrend);
  const firstMonth = revenueTrend[0]?.month
    ? monthNames[revenueTrend[0].month - 1]
    : monthNames[0];
  const lastPoint = revenueTrend[revenueTrend.length - 1];
  const lastMonth = lastPoint?.month
    ? monthNames[lastPoint.month - 1]
    : monthNames[0];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Revenue analytics</CardTitle>

        <CardDescription>Gross sales by month this year</CardDescription>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <EmptyState
            title="No sales recorded this year"
            description="Once the first sale is completed, monthly revenue will appear here."
            action={
              <Button asChild size="sm" className="mt-2">
                <Link to="/sales">Create a sale</Link>
              </Button>
            }
          />
        ) : (
          <>
            <p className="sr-only">
              Revenue from {firstMonth} to {lastMonth}:{" "}
              {formatCurrency(total)} in total.
              {best
                ? ` Best month: ${monthNames[best.month - 1]} with ${formatCurrency(best.total)}.`
                : ""}
            </p>

            <div className="h-72 w-full sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    width={72}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) =>
                      formatCompactCurrency(value)
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      "Revenue",
                    ]}
                    labelFormatter={(label) => `Month: ${label}`}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      borderColor: "var(--border)",
                      borderRadius: "var(--radius-lg)",
                      color: "var(--popover-foreground)",
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#10b981" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
