import { Card, CardContent } from "../../../components/ui/card";

interface InventoryStatsProps {
  stats: [
    {
      title: string;
      value: string;
      icon: any;
    },
  ];
}

export function InventoryStats({ stats }: InventoryStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-muted-foreground text-sm">{stat.title}</p>

              <h2 className="text-3xl font-bold">{stat.value}</h2>
            </div>

            <stat.icon className="text-primary h-8 w-8" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
