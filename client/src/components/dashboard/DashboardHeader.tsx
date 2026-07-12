import { Plus, ShoppingCart, Pill } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

export default function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="via-background flex flex-col gap-6 rounded-2xl border bg-linear-to-r from-emerald-50 to-cyan-50 p-6 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      {/* Welcome section */}

      <div>
        <p className="text-muted-foreground text-sm">Good Morning 👋</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Welcome back, Admin
        </h1>

        <p className="text-muted-foreground mt-2 max-w-xl text-sm">
          Here's what's happening in your pharmacy today. Monitor sales,
          inventory and medicine stock.
        </p>
      </div>

      {/* Actions */}

      <div className="flex flex-wrap gap-3">
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={18} />
          Add Medicine
        </Button>

        <Button variant="outline" className="gap-2">
          <ShoppingCart size={18} />
          New Purchase
        </Button>

        <Button variant="outline" className="gap-2">
          <Pill size={18} />
          New Sale
        </Button>
      </div>
    </motion.div>
  );
}
