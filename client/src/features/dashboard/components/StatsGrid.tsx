import { DollarSign, TrendingUp, Truck, Warehouse } from "lucide-react";

import { formatPercent } from "@/lib/format";

import type {
  DashboardStat,
  DashboardSummary,
  ProfitSummary,
  SalesComparison,
} from "../types/dashboard";
import StatsCard from "./StatsCard";

interface Props {
  summary: DashboardSummary;
  profit: ProfitSummary;
  salesComparison: SalesComparison;
}

export default function StatsGrid({ summary, profit, salesComparison }: Props) {
  const change = salesComparison.percentChange;

  const stats: DashboardStat[] = [
    {
      title: "Sales this month",
      value: summary.totalSales,
      prefix: "Rs. ",
      change,
      hint:
        change === null ? "No prior month to compare" : "vs last month",
      icon: DollarSign,
      iconClassName:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      href: "/sales",
    },
    {
      title: "Gross profit",
      value: profit.grossProfit,
      prefix: "Rs. ",
      hint: `Margin ${formatPercent(profit.marginPercent)}`,
      icon: TrendingUp,
      iconClassName:
        "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
      href: "/reports",
    },
    {
      title: "Inventory value",
      value: summary.totalInventoryValue,
      prefix: "Rs. ",
      hint: `${summary.totalMedicineBatches.toLocaleString()} batches on hand`,
      icon: Warehouse,
      iconClassName:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
      href: "/stock",
    },
    {
      title: "Active suppliers",
      value: summary.activeSuppliers,
      hint: "View supplier list",
      icon: Truck,
      iconClassName:
        "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300",
      href: "/suppliers",
    },
  ];

  return (
    <section
      aria-label="Key performance indicators"
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatsCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
