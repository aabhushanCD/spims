// types/dashboard.ts

import type { LucideIcon } from "lucide-react";

export interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  totalInventoryValue: number;
  totalMedicineBatches: number;
  activeSuppliers: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export interface DashboardStat {
  title: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
  icon: LucideIcon;
  color: string;
}
