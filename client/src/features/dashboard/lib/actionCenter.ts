import { canAccess, type Role } from "@/lib/permissions";

import type {
  DashboardSummary,
  ExpirySummary,
  NotificationSummary,
  ReorderSummary,
} from "../types/dashboard";

export type ActionSeverity = "critical" | "warning" | "info";

export type ActionItemId = "stock" | "expiry" | "reorder" | "notifications";

export interface ActionItem {
  id: ActionItemId;
  title: string;
  detail: string;
  count: number;
  href: string;
  severity: ActionSeverity;
}

interface Input {
  summary: Pick<DashboardSummary, "lowStockCount" | "outOfStockCount">;
  expiry: Pick<ExpirySummary, "expiringSoonCount" | "batchesAwaitingDisposal">;
  reorder: Pick<ReorderSummary, "pendingCount">;
  notifications: Pick<NotificationSummary, "failedDeliveries">;
}

const SEVERITY_ORDER: Record<ActionSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function plural(count: number, singular: string, pluralValue: string) {
  return count === 1 ? singular : pluralValue;
}

/** Aggregates actionable dashboard counts, dropping everything at zero. */
export function buildActionItems(
  { summary, expiry, reorder, notifications }: Input,
  role: Role | null | undefined,
): ActionItem[] {
  const items: ActionItem[] = [];

  const stockCount = summary.lowStockCount + summary.outOfStockCount;
  if (stockCount > 0) {
    items.push({
      id: "stock",
      title: "Stock alerts",
      detail: `${summary.lowStockCount} low · ${summary.outOfStockCount} out`,
      count: stockCount,
      href: "/stock",
      severity: summary.outOfStockCount > 0 ? "critical" : "warning",
    });
  }

  const expiryCount =
    expiry.expiringSoonCount + expiry.batchesAwaitingDisposal;
  if (expiryCount > 0) {
    items.push({
      id: "expiry",
      title: "Expiry queue",
      detail: `${expiry.expiringSoonCount} expiring · ${expiry.batchesAwaitingDisposal} disposal`,
      count: expiryCount,
      href: "/batches",
      severity: expiry.batchesAwaitingDisposal > 0 ? "critical" : "warning",
    });
  }

  if (reorder.pendingCount > 0) {
    items.push({
      id: "reorder",
      title: "Reorders pending",
      detail: `${reorder.pendingCount} ${plural(
        reorder.pendingCount,
        "recommendation",
        "recommendations",
      )} to review`,
      count: reorder.pendingCount,
      href: "/smart-reorders",
      severity: "info",
    });
  }

  if (notifications.failedDeliveries > 0) {
    items.push({
      id: "notifications",
      title: "Notification failures",
      detail: `${notifications.failedDeliveries} ${plural(
        notifications.failedDeliveries,
        "delivery",
        "deliveries",
      )} failed`,
      count: notifications.failedDeliveries,
      href: canAccess(role, ["owner", "pharmacist"])
        ? "/notifications/admin"
        : "/notifications",
      severity: "warning",
    });
  }

  return items.sort(
    (left, right) =>
      SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity] ||
      right.count - left.count,
  );
}
