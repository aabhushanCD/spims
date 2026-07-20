import { Package, AlertTriangle, Clock3, XCircle } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

interface Props {
  summary: {
    totalMedicineBatches: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
  };

  reorder: {
    pendingCount: number;
    highConfidenceCount: number;
    totalSuggestedUnits: number;
  };

  expiry: {
    batchesAwaitingDisposal: number;
    unitsAwaitingDisposal: number;
    expiringSoonCount: number;
  };
}

export default function InventoryHealth({ summary, reorder, expiry }: Props) {
  const issues =
    summary.lowStockCount + summary.outOfStockCount + expiry.expiringSoonCount;

  const health = Math.max(0, 100 - issues * 5);

  const inventoryData = [
    {
      title: "Medicine Batches",
      value: summary.totalMedicineBatches,
      icon: Package,
      description: "Available batches",
    },
    {
      title: "Low Stock",
      value: summary.lowStockCount,
      icon: AlertTriangle,
      description: "Need restocking",
    },
    {
      title: "Expiring Soon",
      value: expiry.expiringSoonCount,
      icon: Clock3,
      description: "Within 30 days",
    },
    {
      title: "Out of Stock",
      value: summary.outOfStockCount,
      icon: XCircle,
      description: "Unavailable",
    },
  ];

  const status =
    health >= 90 ? "Healthy" : health >= 70 ? "Warning" : "Critical";

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
              <p className="text-3xl font-bold">{health}%</p>

              <p className="text-muted-foreground text-sm">Healthy inventory</p>
            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              {status}
            </span>
          </div>

          <Progress value={health} className="h-3" />
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
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Pending Reorders</span>
            <span>{reorder.pendingCount}</span>
          </div>

          <div className="flex justify-between">
            <span>High Confidence</span>
            <span>{reorder.highConfidenceCount}</span>
          </div>

          <div className="flex justify-between">
            <span>Awaiting Disposal</span>
            <span>{expiry.batchesAwaitingDisposal}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
