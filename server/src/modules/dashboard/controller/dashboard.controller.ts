// dashboard.controller.ts
import type { NextFunction, Request, Response } from "express";
import type { DashboardService } from "../service/dashboard.service.ts";
import { AppError } from "../../../shared/error.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /dashboard — single cached call, everything the landing page needs
  getFullDashboard = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getFullDashboard();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/summary
  getSummary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getSummary();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/reorder
  getReorderSummary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getReorderSummary();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/expiry
  getExpirySummary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getExpirySummary();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/recent-activity?limit=10
  getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (Number.isNaN(limit) || limit <= 0) {
      throw AppError.badRequest("limit must be a positive number");
    }
    const data = await this.dashboardService.getRecentActivity(limit);
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/system-health
  getSystemHealth = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getSystemHealth();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/notifications
  getNotificationSummary = asyncHandler(
    async (_req: Request, res: Response) => {
      const data = await this.dashboardService.getNotificationSummary();
      res.status(200).json({ success: true, data });
    },
  );

  // GET /dashboard/profit
  getProfitSummary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getProfitSummary();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/sales-comparison
  getSalesComparison = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getSalesComparison();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/suppliers
  getSupplierAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getSupplierAnalytics();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/sales?year=2026
  getSalesAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year
      ? Number(req.query.year)
      : new Date().getFullYear();
    if (Number.isNaN(year)) {
      throw AppError.badRequest("year must be a valid number");
    }
    const data = await this.dashboardService.getSalesAnalytics(year);
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/purchases
  getPurchaseAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getPurchaseAnalytics();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/inventory
  getInventoryAnalytics = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.dashboardService.getInventoryAnalytics();
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/top-selling?limit=10
  getTopSellingMedicines = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (Number.isNaN(limit) || limit <= 0) {
      throw AppError.badRequest("limit must be a positive number");
    }
    const data = await this.dashboardService.getTopSellingMedicines(limit);
    res.status(200).json({ success: true, data });
  });
}
