import {
  Bell,
  Check,
  AlertTriangle,
  PackageCheck,
  ShoppingCart,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

const notifications = [
  {
    id: 1,
    title: "Low stock alert",
    description: "Paracetamol stock is low",
    icon: AlertTriangle,
    unread: true,
  },
  {
    id: 2,
    title: "Purchase completed",
    description: "ABC Pharma order received",
    icon: PackageCheck,
    unread: true,
  },
  {
    id: 3,
    title: "New sale",
    description: "Invoice #INV-1025 created",
    icon: ShoppingCart,
    unread: false,
  },
];

export default function NotificationDropdown() {
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>

          <Badge>{unreadCount} New</Badge>
        </div>

        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = notification.icon;

            return (
              <div
                key={notification.id}

                className="hover:bg-muted flex gap-3 rounded-lg border p-3"
              >
                <div className="bg-muted rounded-full p-2">
                  <Icon size={16} />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>

                  <p className="text-muted-foreground text-xs">
                    {notification.description}
                  </p>
                </div>

                {notification.unread && (
                  <Check size={16} className="text-emerald-600" />
                )}
              </div>
            );
          })}
        </div>

        <Button variant="outline" className="mt-3 w-full">
          View all notifications
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
