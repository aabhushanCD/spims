// smartReorder.cron.ts
import cron from "node-cron";
import { smartReorderService } from "../smartReorder/smartReorder.module.ts";
export function scheduleSmartReorderJob() {
  // Runs once daily at 2 AM server time
  cron.schedule("0 2 * * *", async () => {
    try {
      const results = await smartReorderService.generateForAllMedicines();
      const created = results.filter((r) => r.status === "created").length;
      console.log(
        `[SmartReorder] Generated ${created} recommendation(s) at ${new Date().toISOString()}`,
      );
    } catch (err) {
      console.error("[SmartReorder] Nightly generation job failed:", err);
    }
  });
}
