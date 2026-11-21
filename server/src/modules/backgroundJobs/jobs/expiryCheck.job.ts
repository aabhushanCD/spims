import cron from "node-cron";
import {
  backgroundJobService,
  medicineBatchService,
  notificationService,
  userRepo,
} from "../../../app/container.ts";
import {
  redisLockProvider,
  runWithLock,
  type LockProvider,
} from "../../../shared/provider/lock.provider.ts";
import { logger } from "../../../shared/logger.ts";

const LOCK_KEY = "lock:expiry-check";
const LOCK_TTL_MS = 30 * 60_000;

export function scheduleExpiryCheckJob(
  lock: LockProvider = redisLockProvider,
) {
  cron.schedule("0 1 * * *", async () => {
    try {
      const acquired = await runWithLock(lock, LOCK_KEY, LOCK_TTL_MS, async () => {
        await backgroundJobService.runJob("expiry-check", async () => {
          const newlyExpired = await medicineBatchService.markExpiredBatches();
          logger.info("expiry_check_completed", {
            newlyExpired: newlyExpired.length,
          });
          if (newlyExpired.length > 0) {
            const pharmacistIds = await userRepo.findIdsByRole("pharmacist");
            await notificationService.createNotification({
              title: "Expired batches require disposal confirmation",
              message: `${newlyExpired.length} batch(es) expired overnight and are pulled from sellable stock. Please confirm disposal to complete write-off.`,
              type: "InApp",
              userIds: pharmacistIds,
              critical: true,
            });
          }
        });
      });
      if (!acquired) {
        logger.info("expiry_check_skipped_lock_held");
      }
    } catch (err) {
      logger.error("expiry_check_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
