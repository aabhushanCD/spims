import CountUp from "react-countup";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import type { DashboardStat } from "@/types/dashboard";

interface Props {
  stat: DashboardStat;
}

export default function StatsCard({ stat }: Props) {
  const Icon = stat.icon;

  const positive = stat.change >= 0;

  return (
    <motion.div
      whileHover={{
        y: -6,
        scale: 1.02,
      }}
      transition={{
        duration: 0.2,
      }}
    >
      <Card className="border-0 shadow-md transition-all hover:shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-muted-foreground text-sm">{stat.title}</p>

              <h2 className="mt-4 text-3xl font-bold">
                {stat.prefix}

                {stat.value}

                {stat.suffix}
              </h2>

              <div
                className={`mt-5 flex w-fit items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                  positive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {positive ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {Math.abs(stat.change)}%
              </div>
            </div>

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ${stat.color}`}
            >
              <Icon size={28} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
