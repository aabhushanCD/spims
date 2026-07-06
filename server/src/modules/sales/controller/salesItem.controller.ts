// saleItem.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/error.ts";
import type { SaleItemService } from "../services/saleItem.service.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class SaleItemController {
  constructor(private readonly saleItemService: SaleItemService) {}

  // GET /sale-items/:id
  getById = asyncHandler(async (req: Request, res: Response) => {
    const item = await this.saleItemService.getById(req.params.id as string);
    res.status(200).json({ success: true, data: item });
  });

  // GET /sale-items/sales/:salesId
  getBySalesId = asyncHandler(async (req: Request, res: Response) => {
    const items = await this.saleItemService.getBySalesId(req.params.salesId as string);
    res.status(200).json({ success: true, data: items });
  });

  // GET /sale-items
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const items = await this.saleItemService.getAll();
    res.status(200).json({ success: true, data: items });
  });

  // PATCH /sale-items/:id — admin correction only (price/discount typos), no quantity/stock changes.
  update = asyncHandler(async (req: Request, res: Response) => {
    const { unitPrice, discount } = req.body;
    if (unitPrice === undefined && discount === undefined) {
      throw AppError.badRequest("Nothing to update");
    }
    const updated = await this.saleItemService.update(req.params.id as string, {
      unitPrice,
      discount,
    });
    res.status(200).json({ success: true, data: updated });
  });
}
