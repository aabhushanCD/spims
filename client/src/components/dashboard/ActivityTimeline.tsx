import {
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";


type MovementType = "SALE" | "PURCHASE" | "RETURN" | "ADJUSTMENT" | "EXPIRED";

interface Activity {
  _id: string;
  movementType: MovementType;
  quantity: number;
  remarks: string;
  createdAt: string;
}

interface Props {
  activities: Activity[];
}

const activityConfig = {
  SALE: {
    icon: ShoppingCart,
    title: "Sale Completed",
    color: "bg-emerald-100 text-emerald-700",
  },
  PURCHASE: {
    icon: PackageCheck,
    title: "Purchase Received",
    color: "bg-blue-100 text-blue-700",
  },
  RETURN: {
    icon: RotateCcw,
    title: "Medicine Returned",
    color: "bg-amber-100 text-amber-700",
  },
  ADJUSTMENT: {
    icon: ArrowUpDown,
    title: "Stock Adjusted",
    color: "bg-purple-100 text-purple-700",
  },
  EXPIRED: {
    icon: AlertTriangle,
    title: "Medicine Expired",
    color: "bg-red-100 text-red-700",
  },
};
export default function ActivityTimeline({ activities }: Props) {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>

        <CardDescription>Latest system updates</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6 max-h-90 overflow-y-auto pr-2">
          {activities.map((activity, index) => {
            const config =
              activityConfig[activity.movementType] ??
              activityConfig.ADJUSTMENT;
            const Icon = config.icon;

            return (
              <motion.div
                key={activity._id}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  delay: index * 0.1,
                }}
                className="flex gap-4"
              >
                {/* Timeline */}

                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon size={18} />
                  </div>

                  {index !== activities.length - 1 && (
                    <div className="bg-border mt-2 h-full w-px" />
                  )}
                </div>

                {/* Content */}

                <div className="pb-5">
                  <p className="font-semibold">{config.title}</p>

                  <p className="text-muted-foreground text-sm">
                    {activity.remarks}
                  </p>

                  <p className="text-muted-foreground text-xs">
                    Quantity: {activity.quantity}
                  </p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
