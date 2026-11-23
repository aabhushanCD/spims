import {
  ArrowRight,
  ClipboardList,
  PackagePlus,
  Receipt,
  Truck,
} from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const steps = [
  {
    title: "Add your first medicine",
    description: "Create the medicine catalogue entry.",
    href: "/medicines",
    icon: PackagePlus,
  },
  {
    title: "Register a supplier",
    description: "Add the pharmacy or distributor you buy from.",
    href: "/suppliers",
    icon: Truck,
  },
  {
    title: "Record a purchase",
    description: "Receive stock and create your first batches.",
    href: "/purchase-orders",
    icon: ClipboardList,
  },
  {
    title: "Make a sale",
    description: "Sell from available batches and start tracking revenue.",
    href: "/sales",
    icon: Receipt,
  },
];

export default function OnboardingChecklist() {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Welcome to SPIMS</CardTitle>

        <CardDescription>
          Your pharmacy is empty right now. Complete these steps to unlock the
          dashboard.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ol className="grid gap-3 sm:grid-cols-2">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <li key={step.title}>
                <Link
                  to={step.href}
                  className="group hover:bg-muted/60 focus-visible:ring-ring flex h-full items-start gap-3 rounded-xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="bg-emerald-600 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white">
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      <Icon size={16} aria-hidden="true" />
                      {step.title}
                    </span>

                    <span className="text-muted-foreground mt-1 block text-xs">
                      {step.description}
                    </span>
                  </span>

                  <ArrowRight
                    size={16}
                    className="text-muted-foreground mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
