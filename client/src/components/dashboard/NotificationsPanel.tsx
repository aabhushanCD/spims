import {
  AlertTriangle,
  Bell,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

const notifications = [
  {
    title: "Low stock alert",
    message: "Paracetamol 500mg stock is below reorder level",
    time: "5 minutes ago",
    type: "warning",
    icon: AlertTriangle,
  },
  {
    title: "Medicine expiring",
    message: "Amoxicillin batch expires in 12 days",
    time: "30 minutes ago",
    type: "danger",
    icon: Bell,
  },
  {
    title: "Purchase received",
    message: "Stock updated from ABC Pharma",
    time: "1 hour ago",
    type: "success",
    icon: PackageCheck,
  },
  {
    title: "Sale completed",
    message: "Invoice INV-1025 generated",
    time: "2 hours ago",
    type: "info",
    icon: ShoppingCart,
  },
];

const notificationStyles = {
  warning: "bg-amber-100 text-amber-700",

  danger: "bg-red-100 text-red-700",

  success: "bg-emerald-100 text-emerald-700",

  info: "bg-blue-100 text-blue-700",
};

export default function NotificationsPanel() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>

            <CardDescription>Latest pharmacy alerts</CardDescription>
          </div>

          <Badge>{notifications.length}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {notifications.map((notification, index) => {
          const Icon = notification.icon;

          return (
            <motion.div
              key={notification.title}

              initial={{
                opacity: 0,
                y: 10,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: index * 0.1,
              }}

              className="hover:bg-muted/50 flex gap-4 rounded-xl border p-4 transition"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  notificationStyles[
                    notification.type as keyof typeof notificationStyles
                  ]
                } `}
              >
                <Icon size={20} />
              </div>

              <div className="space-y-1">
                <p className="font-semibold">{notification.title}</p>

                <p className="text-muted-foreground text-sm">
                  {notification.message}
                </p>

                <p className="text-muted-foreground text-xs">
                  {notification.time}
                </p>
              </div>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
