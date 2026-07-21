import {
  Pill,
  ShoppingCart,
  Receipt,
  Truck,
  UserPlus,
  ArrowRight,
} from "lucide-react";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { Link } from "react-router";

const actions = [
  {
    title: "Add Medicine",
    description: "Create new medicine entry",
    icon: Pill,
    href: "/medicines",
  },
  {
    title: "New Purchase",
    description: "Create purchase order",
    icon: ShoppingCart,
    href: "/purchase-orders",
  },
  {
    title: "New Sale",
    description: "Generate sales invoice",
    icon: Receipt,
    href: "/sales",
  },
  {
    title: "Add Supplier",
    description: "Register supplier",
    icon: Truck,
    href: "/suppliers",
  },
  {
    title: "Add User",
    description: "Create staff account",
    icon: UserPlus,
    href: "/users",
  },
];

export default function QuickActions() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>

        <CardDescription>Frequently used operations</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <motion.div
              key={action.title}
              whileHover={{
                x: 5,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <Link to={action.href}  className="group hover:bg-muted flex h-auto w-full items-center justify-between rounded-xl border p-4">
               
               
        
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                    <Icon size={20} />
                  </div>

                  <div className="text-left">
                    <p className="font-semibold">{action.title}</p>

                    <p className="text-muted-foreground text-xs">
                      {action.description}
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={18}
                  className="opacity-0 transition group-hover:opacity-100"
                />
              </Link>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
