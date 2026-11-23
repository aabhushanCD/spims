// types/dashboard.ts

import type { LucideIcon } from "lucide-react";

export interface MonthlySalesPoint {
  month: number;
  total: number;
  count: number;
}

export interface DashboardSummary {
  totalSales: number;
  totalPurchases: number;
  totalInventoryValue: number;
  totalMedicineBatches: number;
  activeSuppliers: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
  revenueTrend: MonthlySalesPoint[];
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

export interface ProfitSummary {
  totalSales: number;
  totalPurchases: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
}

export interface RangeAnalytics {
  from: string;
  to: string;
  profit: ProfitSummary;
  totalSales: number;
  totalVat: number;
  refunds: {
    grossRefunds: number;
    refundVat: number;
  };
}

export interface CashierSalesRow {
  cashierId: string;
  cashierName: string;
  total: number;
  count: number;
}

export interface CategorySalesRow {
  categoryId: string;
  categoryName: string;
  quantity: number;
  total: number;
}

export interface TopSellingRow {
  medicineId: string;
  medicineName: string;
  strength: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface SupplierAnalytics {
  activeSuppliers: number;
  inactiveSuppliers: number;
  total: number;
}

export interface SalesAnalytics {
  year: number;
  totalSales: number;
  totalVat: number;
  salesByMonth: MonthlySalesPoint[];
}

export interface PurchaseAnalytics {
  totalPurchases: number;
  purchasesByStatus: { status: string; count: number }[];
}

export interface InventoryAnalytics {
  totalValue: number;
  inventoryHealth: {
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
  };
  lowStockCount: number;
  outOfStockCount: number;
  expiringSoonCount: number;
}

export type CsvExportType = "sales" | "purchases" | "returns" | "inventory";

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "EXPIRED"
  | "RESERVE"
  | "RELEASE"
  | "PURCHASE_RETURN";

export interface DashboardMovement {
  _id: string;
  movementType: MovementType;
  quantity: number;
  remarks: string;
  createdAt: string;
}

export interface ReorderSummary {
  pendingCount: number;
  highConfidenceCount: number;
  totalSuggestedUnits: number;
}

export interface ExpirySummary {
  batchesAwaitingDisposal: number;
  unitsAwaitingDisposal: number;
  expiringSoonCount: number;
}

export type BackgroundJobStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export interface SystemHealthSummary {
  staleJobCount: number;
  staleJobs: Array<{
    jobName: string;
    startedAt: string;
    status: BackgroundJobStatus;
  }>;
}

export interface NotificationSummary {
  failedDeliveries: number;
  pendingDeliveries: number;
  skippedDeliveries: number;
}

export interface SalesComparison {
  thisMonth: number;
  lastMonth: number;
  /** null when the previous month had no sales, so no baseline exists. */
  percentChange: number | null;
}

/** Everything returned by `GET /dashboard` in a single cached payload. */
export interface DashboardPayload {
  summary: DashboardSummary;
  reorder: ReorderSummary;
  expiry: ExpirySummary;
  recentActivity: DashboardMovement[];
  systemHealth: SystemHealthSummary;
  notifications: NotificationSummary;
  profit: ProfitSummary;
  salesComparison: SalesComparison;
}
