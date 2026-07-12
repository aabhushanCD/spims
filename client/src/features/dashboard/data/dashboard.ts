import type { DashboardStat } from "@/types/dashboard";
import { DollarSign, ShoppingCart, Boxes, TriangleAlert } from "lucide-react";


export const dashboardStats: DashboardStat[] = [
  {
    title: "Revenue",
    value: 458650,
    change: 18.4,
    prefix: "Rs. ",
    icon: DollarSign,
    color: "bg-emerald-500",
  },
  {
    title: "Sales",
    value: 348,
    change: 9.2,
    icon: ShoppingCart,
    color: "bg-blue-500",
  },
  {
    title: "Inventory",
    value: 1284,
    change: 5.1,
    icon: Boxes,
    color: "bg-violet-500",
  },
  {
    title: "Expiring Soon",
    value: 12,
    change: -2.8,
    icon: TriangleAlert,
    color: "bg-amber-500",
  },
];
