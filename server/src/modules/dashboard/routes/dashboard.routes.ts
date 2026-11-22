import { Router } from "express";
import { dashboardController } from "../../../app/container.ts";

const router = Router();

router.get("/", dashboardController.getFullDashboard);
router.get("/summary", dashboardController.getSummary);
router.get("/reorder", dashboardController.getReorderSummary);
router.get("/expiry", dashboardController.getExpirySummary);
router.get("/recent-activity", dashboardController.getRecentActivity);
router.get("/system-health", dashboardController.getSystemHealth);
router.get("/notifications", dashboardController.getNotificationSummary);
router.get("/profit", dashboardController.getProfitSummary);
router.get("/sales-comparison", dashboardController.getSalesComparison);
router.get("/suppliers", dashboardController.getSupplierAnalytics);
router.get("/sales", dashboardController.getSalesAnalytics);
router.get("/purchases", dashboardController.getPurchaseAnalytics);
router.get("/inventory", dashboardController.getInventoryAnalytics);
router.get("/top-selling", dashboardController.getTopSellingMedicines);
router.get("/range", dashboardController.getRangeAnalytics);
router.get("/by-cashier", dashboardController.getSalesByCashier);
router.get("/by-category", dashboardController.getSalesByCategory);
router.get("/export", dashboardController.exportCsv);

export default router;
