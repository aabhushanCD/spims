import {
  AlertTriangle,
  ArrowUpDown,
  History,
  PackageCheck,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";

import type { DashboardMovement, MovementType } from "../types/dashboard";

interface Props {
  activities: DashboardMovement[];
}

const activityConfig: Partial<
  Record<MovementType, { icon: typeof ShoppingCart; title: string; color: string }>
> = {
  SALE: {
    icon: ShoppingCart,
    title: "Sale Completed",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  PURCHASE: {
    icon: PackageCheck,
    title: "Purchase Received",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  RETURN: {
    icon: RotateCcw,
    title: "Medicine Returned",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  ADJUSTMENT: {
    icon: ArrowUpDown,
    title: "Stock Adjusted",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
  },
  EXPIRED: {
    icon: AlertTriangle,
    title: "Medicine Expired",
    color: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

const defaultActivity = {
  icon: ArrowUpDown,
  title: "Stock Adjusted",
  color:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
};

export default function ActivityTimeline({ activities }: Props) {
  const reduceMotion = useReducedMotion();
  const items = activities ?? [];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>

        <CardDescription>Latest stock and sales updates</CardDescription>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <History
              className="text-muted-foreground h-9 w-9"
              aria-hidden="true"
            />
            <p className="font-medium">No recent activity</p>
            <p className="text-muted-foreground text-sm">
              Stock movements and sales will appear here.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link to="/inventory/movements">View movements</Link>
            </Button>
          </div>
        ) : (
          <ol className="max-h-96 space-y-6 overflow-y-auto pr-2">
            {items.map((activity, index) => {
              const config =
                activityConfig[activity.movementType] ?? defaultActivity;
              const Icon = config.icon;

              return (
                <motion.li
                  key={activity._id}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
                  className="flex gap-4"
                >
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </div>

                    {index !== items.length - 1 && (
                      <div className="bg-border mt-2 h-full w-px" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 pb-5">
                    <p className="font-semibold">{config.title}</p>

                    <p className="text-muted-foreground text-sm">
                      {activity.remarks || "No remarks"}
                    </p>

                    <p className="text-muted-foreground text-xs">
                      Quantity: {activity.quantity.toLocaleString()}
                    </p>

                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>

      {items.length > 0 && (
        <CardFooter>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to="/inventory/movements">View all movements</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
