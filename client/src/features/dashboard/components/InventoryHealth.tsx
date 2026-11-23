import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  PackageX,
  XCircle,
} from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DashboardSummary, ExpirySummary } from "../types/dashboard";

interface Props {
  summary: Pick<
    DashboardSummary,
    "totalMedicineBatches" | "lowStockCount" | "outOfStockCount"
  >;
  expiry: ExpirySummary;
}

export default function InventoryHealth({ summary, expiry }: Props) {
  const alerts = [
    {
      title: "Low stock",
      value: summary.lowStockCount,
      description: "Need restocking",
      href: "/stock",
      icon: AlertTriangle,
      iconClassName:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      title: "Out of stock",
      value: summary.outOfStockCount,
      description: "Unavailable to sell",
      href: "/stock",
      icon: XCircle,
      iconClassName:
        "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
    {
      title: "Expiring soon",
      value: expiry.expiringSoonCount,
      description: "Within 30 days",
      href: "/batches",
      icon: Clock3,
      iconClassName:
        "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    },
    {
      title: "Awaiting disposal",
      value: expiry.batchesAwaitingDisposal,
      description: `${expiry.unitsAwaitingDisposal.toLocaleString()} units to dispose`,
      href: "/batches",
      icon: PackageX,
      iconClassName:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  ];

  const totalAlerts = alerts.reduce((sum, alert) => sum + alert.value, 0);

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Stock health</CardTitle>

        <CardDescription>
          {summary.totalMedicineBatches.toLocaleString()} batches on hand
        </CardDescription>
      </CardHeader>

      <CardContent>
        {totalAlerts === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2
              className="h-9 w-9 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
            <p className="font-medium">All stock healthy</p>
            <p className="text-muted-foreground text-sm">
              No low-stock, expiry, or disposal items right now.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/stock">Review stock</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {alerts.map((alert) => {
              const Icon = alert.icon;

              return (
                <Link
                  key={alert.title}
                  to={alert.href}
                  className="bg-muted/30 hover:bg-muted/60 focus-visible:ring-ring group rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2 ${alert.iconClassName}`}>
                      <Icon size={18} aria-hidden="true" />
                    </div>

                    <ArrowUpRight
                      size={16}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-4 text-2xl font-bold">
                    {alert.value.toLocaleString()}
                  </p>

                  <p className="text-sm font-medium">{alert.title}</p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {alert.description}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
