import { describe, expect, it, vi } from "vitest";

import type { NotificationRecipientRepo } from "../../notification/repo/notificationRecipient.repo.ts";
import { DashboardService } from "./dashboard.service.ts";

describe("DashboardService notification summary", () => {
  it("counts Skipped separately from Failed", async () => {
    const notificationRecipientRepo = {
      countByStatus: vi.fn(async (status: string) => {
        if (status === "Failed") return 2;
        if (status === "Pending") return 3;
        if (status === "Skipped") return 4;
        return 0;
      }),
    };

    const service = new DashboardService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      notificationRecipientRepo as unknown as NotificationRecipientRepo,
    );

    await expect(service.getNotificationSummary()).resolves.toEqual({
      failedDeliveries: 2,
      pendingDeliveries: 3,
      skippedDeliveries: 4,
    });
    expect(notificationRecipientRepo.countByStatus).toHaveBeenCalledWith(
      "Skipped",
    );
  });
});
