// UserStats.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  total: number;

  active: number;

  inactive: number;
}

export function UserStats({ total, active, inactive }: Props) {
  const stats = [
    {
      title: "Total Users",
      value: total,
    },
    {
      title: "Active Users",
      value: active,
    },
    {
      title: "Inactive Users",
      value: inactive,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((item) => (
        <Card key={item.title}>
          <CardHeader>
            <CardTitle className="text-sm">{item.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
