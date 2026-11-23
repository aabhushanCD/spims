import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  PackageSearch,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Shortcut {
  title: string;
  description: string;
  icon: typeof Boxes;
  href: string;
}

const shortcuts: Shortcut[] = [
  {
    title: "Stock overview",
    description: "Check inventory levels",
    icon: Boxes,
    href: "/stock",
  },
  {
    title: "Batches",
    description: "Track expiry and batches",
    icon: PackageSearch,
    href: "/batches",
  },
  {
    title: "Reorder queue",
    description: "Review smart suggestions",
    icon: ClipboardList,
    href: "/smart-reorders",
  },
  {
    title: "Customers",
    description: "Manage customer records",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Suppliers",
    description: "Manage supplier accounts",
    icon: Truck,
    href: "/suppliers",
  },
  {
    title: "Reports",
    description: "Sales and profit analytics",
    icon: BarChart3,
    href: "/reports",
  },
];

export default function QuickActions() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Shortcuts</CardTitle>

        <CardDescription>Jump to common areas</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;

            return (
              <Link
                key={shortcut.title}
                to={shortcut.href}
                className="group hover:bg-muted/60 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <Icon size={18} aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {shortcut.title}
                    </p>

                    <p className="text-muted-foreground truncate text-xs">
                      {shortcut.description}
                    </p>
                  </div>
                </div>

                <ArrowRight
                  size={16}
                  className="text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
