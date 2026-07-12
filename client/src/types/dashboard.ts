import type { LucideIcon } from "lucide-react";

export interface DashboardStat {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
  prefix?: string;
  suffix?: string;
  color: string;
}
