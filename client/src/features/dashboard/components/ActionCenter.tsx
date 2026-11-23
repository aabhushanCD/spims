import {
  ArrowUpRight,
  BellOff,
  CheckCircle2,
  ClipboardList,
  Clock3,
  PackageX,
} from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/features/auth/context/authContext";

import {
  buildActionItems,
  type ActionItemId,
} from "../lib/actionCenter";
import type {
  DashboardSummary,
  ExpirySummary,
  NotificationSummary,
  ReorderSummary,
} from "../types/dashboard";

interface Props {
  summary: Pick<DashboardSummary, "lowStockCount" | "outOfStockCount">;
  expiry: Pick<ExpirySummary, "expiringSoonCount" | "batchesAwaitingDisposal">;
  reorder: Pick<ReorderSummary, "pendingCount">;
  notifications: Pick<NotificationSummary, "failedDeliveries">;
}

const itemVisuals: Record<
  ActionItemId,
  { icon: typeof PackageX; tone: string }
> = {
  stock: {
    icon: PackageX,
    tone: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  expiry: {
    icon: Clock3,
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  reorder: {
    icon: ClipboardList,
    tone: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  notifications: {
    icon: BellOff,
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
};

export default function ActionCenter({
  summary,
  expiry,
  reorder,
  notifications,
}: Props) {
  const { currentUser } = useAuth();
  const items = buildActionItems(
    { summary, expiry, reorder, notifications },
    currentUser?.role,
  );

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Action center</CardTitle>

        <CardDescription>
          {items.length > 0
            ? "Resolve these to keep the pharmacy running smoothly."
            : "What needs attention right now."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <CheckCircle2
              className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />

            <div>
              <p className="font-medium">No urgent actions</p>

              <p className="text-muted-foreground text-sm">
                Stock, expiry, reorders and notification delivery look good.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => {
              const visual = itemVisuals[item.id];
              const Icon = visual.icon;

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className="group hover:bg-muted/60 focus-visible:ring-ring rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2 ${visual.tone}`}>
                      <Icon size={18} aria-hidden="true" />
                    </div>

                    <ArrowUpRight
                      size={16}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-3 text-2xl font-bold">
                    {item.count.toLocaleString()}
                  </p>

                  <p className="text-sm font-medium">{item.title}</p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.detail}
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
