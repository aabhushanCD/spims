import { Package, AlertTriangle, Clock3, XCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

const inventoryData = [
  {
    title: "Total Medicines",
    value: "1,284",
    icon: Package,
    description: "Active medicines",
  },
  {
    title: "Low Stock",
    value: "24",
    icon: AlertTriangle,
    description: "Need restocking",
  },
  {
    title: "Expiring Soon",
    value: "12",
    icon: Clock3,
    description: "Within 30 days",
  },
  {
    title: "Out of Stock",
    value: "5",
    icon: XCircle,
    description: "Unavailable",
  },
];

export default function InventoryHealth() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Inventory Health</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress section */}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold">92%</p>

              <p className="text-muted-foreground text-sm">Healthy inventory</p>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              Healthy
            </span>
          </div>

          <Progress value={92} className="h-3" />
        </div>

        {/* Stats */}

        <div className="grid grid-cols-2 gap-4">
          {inventoryData.map((item) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}

                whileHover={{
                  scale: 1.03,
                }}

                className="bg-muted/30 rounded-xl border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="bg-background rounded-lg p-2 shadow-sm">
                    <Icon size={20} />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold">{item.value}</p>

                <p className="text-sm font-medium">{item.title}</p>

                <p className="text-muted-foreground mt-1 text-xs">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
