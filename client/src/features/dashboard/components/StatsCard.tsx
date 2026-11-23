import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

import type { DashboardStat } from "../types/dashboard";

interface Props {
  stat: DashboardStat;
}

export default function StatsCard({ stat }: Props) {
  const Icon = stat.icon;
  const reduceMotion = useReducedMotion();
  const isCurrency = stat.prefix?.includes("Rs.");
  const displayValue = isCurrency
    ? formatCompactCurrency(stat.value)
    : stat.value.toLocaleString();
  const fullValue = isCurrency
    ? formatCurrency(stat.value)
    : stat.value.toLocaleString();
  const hasDelta = typeof stat.change === "number";
  const positive = (stat.change ?? 0) >= 0;

  const card = (
    <Card className="h-full border-0 shadow-md transition-all hover:shadow-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-sm">{stat.title}</p>

            <h2
              className="mt-4 truncate text-3xl font-bold"
              title={fullValue}
              aria-label={`${stat.title}: ${fullValue}`}
            >
              {displayValue}
              {stat.suffix}
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {hasDelta && (
                <span
                  className={`flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                    positive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                  }`}
                >
                  {positive ? (
                    <ArrowUpRight size={14} aria-hidden="true" />
                  ) : (
                    <ArrowDownRight size={14} aria-hidden="true" />
                  )}
                  {Math.abs(stat.change ?? 0)}%
                </span>
              )}

              {stat.hint && (
                <p className="text-muted-foreground text-xs">{stat.hint}</p>
              )}
            </div>
          </div>

          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.iconClassName}`}
          >
            <Icon size={24} aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      {stat.href ? (
        <Link
          to={stat.href}
          className="focus-visible:ring-ring block h-full rounded-xl focus-visible:ring-2 focus-visible:outline-none"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}
