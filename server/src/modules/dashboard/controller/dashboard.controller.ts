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

  private parseRange(req: Request): { from: Date; to: Date } {
    const from = req.query.from ? new Date(req.query.from as string) : null;
    const to = req.query.to ? new Date(req.query.to as string) : null;
    if (
      !from ||
      !to ||
      Number.isNaN(from.getTime()) ||
      Number.isNaN(to.getTime()) ||
      from > to
    ) {
      throw AppError.badRequest(
        "from and to are required valid dates, and from must not be after to",
      );
    }
    return { from, to };
  }

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
    if (!Number.isInteger(limit) || limit <= 0) {
      throw AppError.badRequest("limit must be a positive whole number");
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
    const currentYear = new Date().getFullYear();
    const year = req.query.year ? Number(req.query.year) : currentYear;
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw AppError.badRequest(
        "year must be a whole number between 2000 and 2100",
      );
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

  // GET /dashboard/range?from=&to=
  getRangeAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = this.parseRange(req);
    const data = await this.dashboardService.getRangeAnalytics(from, to);
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/by-cashier?from=&to=
  getSalesByCashier = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = this.parseRange(req);
    const data = await this.dashboardService.getSalesByCashier(from, to);
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/by-category?from=&to=
  getSalesByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { from, to } = this.parseRange(req);
    const data = await this.dashboardService.getSalesByCategory(from, to);
    res.status(200).json({ success: true, data });
  });

  // GET /dashboard/export?type=sales|purchases|returns|inventory&from=&to=
  exportCsv = asyncHandler(async (req: Request, res: Response) => {
    const type = req.query.type as string;
    if (!["sales", "purchases", "returns", "inventory"].includes(type)) {
      throw AppError.badRequest(
        "type must be sales, purchases, returns, or inventory",
      );
    }
    const csvType = type as "sales" | "purchases" | "returns" | "inventory";
    const range = csvType === "inventory" ? null : this.parseRange(req);
    const csv = await this.dashboardService.getCsvExport(
      csvType,
      range?.from,
      range?.to,
    );
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      csvType === "inventory"
        ? `attachment; filename="inventory-snapshot.csv"`
        : `attachment; filename="${csvType}-${range!.from.toISOString().slice(0, 10)}-${range!.to.toISOString().slice(0, 10)}.csv"`,
    );
    res.status(200).send(csv);
  });

  // GET /dashboard/top-selling?limit=10
  getTopSellingMedicines = asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    if (!Number.isInteger(limit) || limit <= 0) {
      throw AppError.badRequest("limit must be a positive whole number");
    }
    const data = await this.dashboardService.getTopSellingMedicines(limit);
    res.status(200).json({ success: true, data });
  });
}
