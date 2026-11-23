import { format } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/authContext";
import AddMedicineDialog from "@/features/medicine/components/AddMedicineDialog";
import PurchaseDialog from "@/features/purchase/components/PurchaseDialog";
import { SaleDialog } from "@/features/sales/components/SaleDialog";
import { getFirstName, getGreeting } from "../lib/greeting";

interface Props {
  lastUpdated?: number;
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export default function DashboardHeader({
  lastUpdated,
  isRefreshing = false,
  onRefresh,
}: Props) {
  const { currentUser } = useAuth();
  const reduceMotion = useReducedMotion();
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const firstName = getFirstName(currentUser?.name);

  return (
    <motion.header
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 rounded-2xl border bg-linear-to-r from-emerald-50 to-cyan-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between dark:from-emerald-950/40 dark:to-cyan-950/40"
    >
      {/* Welcome section */}
      <div>
        <p className="text-muted-foreground text-sm">{greeting} 👋</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {firstName}
        </h1>

        <p className="text-muted-foreground mt-2 text-sm">
          {format(now, "EEEE, d MMMM")} · Here&apos;s what needs your attention
          today.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-start gap-3 md:items-end">
        <div className="flex items-center gap-2">
          {lastUpdated ? (
            <span className="text-muted-foreground text-xs">
              Checked {format(new Date(lastUpdated), "HH:mm")}
            </span>
          ) : null}

          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refresh dashboard"
            >
              <RefreshCw
                className={isRefreshing ? "animate-spin" : undefined}
                aria-hidden="true"
              />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <SaleDialog />

          <PurchaseDialog />

          <AddMedicineDialog />
        </div>
      </div>
    </motion.header>
  );
}
