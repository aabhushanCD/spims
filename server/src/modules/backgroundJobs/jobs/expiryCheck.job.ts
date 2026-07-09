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
  cron.schedule("0 1 * * *", async () => {
    try {
      await backgroundJobService.runJob("expiry-check", async () => {
        const newlyExpired = await medicineBatchService.markExpiredBatches();

        if (newlyExpired.length > 0) {
          const pharmacistIds = await userRepo.findIdsByRole("pharmacist");
          await notificationService.createNotification({
            title: "Expired batches require disposal confirmation",
            message: `${newlyExpired.length} batch(es) expired overnight and are pulled from sellable stock. Please confirm disposal to complete write-off.`,
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
