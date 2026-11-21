import cron from "node-cron";
import {
  backgroundJobService,
  smartReorderService,
} from "../../../app/container.ts";
import {
  redisLockProvider,
  runWithLock,
  type LockProvider,
} from "../../../shared/provider/lock.provider.ts";
import { logger } from "../../../shared/logger.ts";

const LOCK_KEY = "lock:reorder-calculation";
const LOCK_TTL_MS = 2 * 60 * 60_000;

export function scheduleReorderCalculationJob(
  lock: LockProvider = redisLockProvider,
) {
  cron.schedule("0 2 * * *", async () => {
    try {
      const acquired = await runWithLock(lock, LOCK_KEY, LOCK_TTL_MS, async () => {
        const data = await backgroundJobService.runJob(
          "reorder-calculation",
          () => smartReorderService.generateForAllMedicines(),
        );
        logger.info("reorder_calculation_completed", { result: data });
      });
      if (!acquired) {
        logger.info("reorder_calculation_skipped_lock_held");
      }
    } catch (err) {
      logger.error("reorder_calculation_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
