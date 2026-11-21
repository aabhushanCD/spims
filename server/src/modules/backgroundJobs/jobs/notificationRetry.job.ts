import cron from "node-cron";
import { notificationService } from "../../../app/container.ts";
import {
  redisLockProvider,
  runWithLock,
  type LockProvider,
} from "../../../shared/provider/lock.provider.ts";
import { logger } from "../../../shared/logger.ts";

const LOCK_KEY = "lock:notification-retry";
const LOCK_TTL_MS = 55_000;

// Runs every minute. Intentionally not wrapped in BackgroundJobService.runJob:
// a per-minute record would create 1,440 audit rows per day for a sweep that is
// already observable through recipient status and nextAttemptAt.
export function scheduleNotificationRetryJob(
  lock: LockProvider = redisLockProvider,
) {
  let running = false;

  cron.schedule("* * * * *", async () => {
    if (running) {
      logger.warn("notification_retry_skipped_overlap");
      return;
    }

    running = true;
    try {
      const acquired = await runWithLock(lock, LOCK_KEY, LOCK_TTL_MS, async () => {
        const result = await notificationService.retryScheduled();
        if (result.attempted > 0) {
          logger.info("notification_retry_completed", {
            attempted: result.attempted,
          });
        }
      });
      if (!acquired) {
        logger.debug("notification_retry_skipped_lock_held");
      }
    } catch (err) {
      logger.error("notification_retry_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      running = false;
    }
  });
}
