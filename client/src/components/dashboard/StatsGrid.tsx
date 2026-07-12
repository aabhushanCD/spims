import { dashboardStats } from "@/features/dashboard/data/dashboard";
import StatsCard from "./StatsCard";

export default function StatsGrid() {
  return (
    <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {dashboardStats.map((stat) => (
        <StatsCard key={stat.title} stat={stat} />
      ))}
    </section>
  );
}
