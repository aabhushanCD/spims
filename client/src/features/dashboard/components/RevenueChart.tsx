import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { monthNames } from "@/features/dashboard/data/monthName";

interface Props {
  revenueTrend: {
    month: number;
    total: number;
    count: number;
  }[];
}

export default function RevenueChart({ revenueTrend }: Props) {
  const chartData = revenueTrend.map((item) => ({
    month: monthNames[item.month - 1], // Convert month number to month name
    revenue: item.total,
    sales: item.count,
  }));

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Revenue Analytics</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="h-87.5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="month" />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={4}
                dot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
