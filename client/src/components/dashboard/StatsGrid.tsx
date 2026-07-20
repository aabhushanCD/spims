import StatsCard from "./StatsCard";
import type {
  DashboardStat,
  DashboardSummary,
} from "@/features/dashboard/types/dashboard";
import {
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Warehouse,
  XCircle,
} from "lucide-react";

interface Props {
  summary: DashboardSummary;
}

export default function StatsGrid({ summary }: Props) {
  const stats: DashboardStat[] = [
    {
      title: "Total Sales",
      value: summary.totalSales,
      prefix: "Rs. ",
      change: 0,
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Purchases",
      value: summary.totalPurchases,
      prefix: "Rs. ",
      change: 0,
      icon: ShoppingCart,
      color: "bg-blue-500",
    },
    {
      title: "Inventory Value",
      value: summary.totalInventoryValue,
      prefix: "Rs. ",
      change: 0,
      icon: Warehouse,
      color: "bg-purple-500",
    },
    {
      title: "Medicine Batches",
      value: summary.totalMedicineBatches,
      change: 0,
      icon: Package,
      color: "bg-indigo-500",
    },
    {
      title: "Suppliers",
      value: summary.activeSuppliers,
      change: 0,
      icon: Truck,
      color: "bg-cyan-500",
    },
    {
      title: "Low Stock",
      value: summary.lowStockCount,
      change: 0,
      icon: AlertTriangle,
      color: "bg-orange-500",
    },
    {
      title: "Out Of Stock",
      value: summary.outOfStockCount,
      change: 0,
      icon: XCircle,
      color: "bg-red-500",
    },
    {
      title: "Expiring Soon",
      value: summary.expiringSoonCount,
      change: 0,
      icon: Clock,
      color: "bg-yellow-500",
    },
  ];

  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
