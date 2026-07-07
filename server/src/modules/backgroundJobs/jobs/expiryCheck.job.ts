// jobs/expiryCheck.job.ts
import cron from "node-cron"; // adjust to however you fetch admin/pharmacist ids
import {
  backgroundJobService,
  medicineBatchService,
  notificationService,
  userRepo,
} from "../../../app/container.ts";

const NEARING_EXPIRY_DAYS = 30;

export function scheduleExpiryCheckJob() {
  // Runs daily at 1 AM
  cron.schedule("0 1 * * *", async () => {
    try {
      await backgroundJobService.runJob("expiry-check", async () => {
        await medicineBatchService.markExpiredBatches();

        const allBatches = await medicineBatchService.getAllBatches();
        const now = new Date();
        const nearingExpiry = allBatches.filter((b) => {
          const daysUntilExpiry =
            (b.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysUntilExpiry > 0 && daysUntilExpiry <= NEARING_EXPIRY_DAYS;
        });

        if (nearingExpiry.length > 0) {
          const pharmacistIds = await userRepo.findIdsByRole("pharmacist");
          await notificationService.createNotification({
            title: "Batches nearing expiry",
            message: `${nearingExpiry.length} batch(es) will expire within ${NEARING_EXPIRY_DAYS} days.`,
            type: "InApp",
            userIds: pharmacistIds,
          });
        }
      });
    } catch (err) {
      console.error("[ExpiryCheck] Job failed:", err);
    }
  });
}
