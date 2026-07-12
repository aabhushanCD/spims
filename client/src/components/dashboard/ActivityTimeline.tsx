import { ShoppingCart, Pill, UserPlus, PackageCheck } from "lucide-react";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const activities = [
  {
    title: "Sale completed",
    description: "Invoice #INV-1024 generated",
    time: "2 minutes ago",
    icon: ShoppingCart,
    type: "sale",
  },
  {
    title: "Purchase received",
    description: "Stock updated from ABC Pharma",
    time: "35 minutes ago",
    icon: PackageCheck,
    type: "purchase",
  },
  {
    title: "Medicine added",
    description: "Paracetamol 500mg added",
    time: "2 hours ago",
    icon: Pill,
    type: "medicine",
  },
  {
    title: "New staff account created",
    description: "Inventory manager added",
    time: "Yesterday",
    icon: UserPlus,
    type: "user",
  },
];

export default function ActivityTimeline() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>

        <CardDescription>Latest system updates</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <motion.div
                key={activity.title}
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Icon size={18} />
                  </div>

                  {index !== activities.length - 1 && (
                    <div className="bg-border mt-2 h-full w-px" />
                  )}
                </div>

                {/* Content */}

                <div className="pb-5">
                  <p className="font-semibold">{activity.title}</p>

                  <p className="text-muted-foreground text-sm">
                    {activity.description}
                  </p>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {activity.time}
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
