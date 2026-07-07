// jobs/reorderCalculation.job.ts
import cron from "node-cron";
import {
  backgroundJobService,
  smartReorderService,
} from "../../../app/container.ts";

export function scheduleReorderCalculationJob() {
  // Runs daily at 2 AM
  cron.schedule("0 2 * * *", async () => {
    try {
      await backgroundJobService.runJob("reorder-calculation", () =>
        smartReorderService.generateForAllMedicines(),
      );
    } catch (err) {
      console.error("[ReorderCalculation] Job failed:", err);
    }
  });
}
