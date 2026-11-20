// jobs/notificationRetry.job.ts
import cron from "node-cron";
import { notificationService } from "../../../app/container.ts";

// Runs every minute. Intentionally not wrapped in BackgroundJobService.runJob:
// a per-minute record would create 1,440 audit rows per day for a sweep that is
// already observable through recipient status and nextAttemptAt.
export function scheduleNotificationRetryJob() {
  let running = false;

  cron.schedule("* * * * *", async () => {
    if (running) {
      console.warn(
        "[NotificationRetry] Previous sweep still running; skipping this tick",
      );
      return;
    }

    running = true;
    try {
      const result = await notificationService.retryScheduled();
      if (result.attempted > 0) {
        console.log(
          `[NotificationRetry] Retried ${result.attempted} notification(s) at ${new Date().toISOString()}`,
        );
      }
    } catch (err) {
      console.error("[NotificationRetry] Job failed:", err);
    } finally {
      running = false;
    }
  });
}
