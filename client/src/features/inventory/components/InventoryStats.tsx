import { Card, CardContent } from "../../../components/ui/card";
import { Boxes, Package, Archive } from "lucide-react";

const stats = [
  {
    title: "Medicines",
    value: "3",
    icon: Boxes,
  },
  {
    title: "Current Stock",
    value: "200",
    icon: Package,
  },
  {
    title: "Reserved",
    value: "0",
    icon: Archive,
  },
];

export function InventoryStats() {
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
