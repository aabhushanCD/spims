import { motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/context/authContext";
import AddMedicineDialog from "@/features/medicine/components/AddMedicineDialog";
import PurchaseDialog from "@/features/purchase/components/PurchaseDialog";
import { SaleDialog } from "@/features/sales/components/SaleDialog";
import { useDateFormat } from "@/lib/datetime/dateFormatContext";
import { getFirstName, getGreetingKey } from "../lib/greeting";

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
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const reduceMotion = useReducedMotion();
  const { hour, format, time } = useDateFormat();
  const now = new Date();
  const greeting = t(`dashboard.greeting.${getGreetingKey(hour(now))}`);
  const firstName = getFirstName(currentUser?.name);
  const date = format(now, { style: "date" });

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
          {t("dashboard.welcomeBack", { name: firstName })}
        </h1>

        <p className="text-muted-foreground mt-2 text-sm">
          {date.full} · {t("dashboard.attention")}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-start gap-3 md:items-end">
        <div className="flex items-center gap-2">
          {lastUpdated ? (
            <span className="text-muted-foreground text-xs">
              {t("dashboard.checked", {
                time: time(new Date(lastUpdated)),
              })}
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
