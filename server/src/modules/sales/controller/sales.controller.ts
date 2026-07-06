// sales.controller.ts
import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../../shared/error.ts";
import type { SalesService } from "../services/sales.service.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // POST /sales
  // body: { invoiceNumber, customerName, paymentMethod,
  //  saleDate, items: [{medicineId, batchId, quantity,
  // unitPrice, discount?}], overallDiscount? }
  createSale = asyncHandler(async (req: Request, res: Response) => {
    const cashierId = req.user?.userId;
    if (!cashierId) {
      throw AppError.unauthorized("Authenticated user required");
    }

    const {
      invoiceNumber,
      customerName,
      paymentMethod,
      saleDate,
      items,
      overallDiscount,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw AppError.badRequest("Sale must include at least one item");
    }

    const sale = await this.salesService.createSale({
      invoiceNumber,
      customerName,
      paymentMethod,
      saleDate,
      cashierId,
      items,
      overallDiscount,
    });

    res.status(201).json({ success: true, data: sale });
  });

  // GET /sales/:id
  getSaleById = asyncHandler(async (req: Request, res: Response) => {
    const sale = await this.salesService.getSaleById(req.params.id as string);
    res.status(200).json({ success: true, data: sale });
  });

  // GET /sales
  getAllSales = asyncHandler(async (_req: Request, res: Response) => {
    const sales = await this.salesService.getAllSales();
    res.status(200).json({ success: true, data: sales });
  });

  // PATCH /sales/:id
  // body: { customerName?, paymentMethod? } — financial/quantity fields are NOT editable here
  updateSale = asyncHandler(async (req: Request, res: Response) => {
    const { customerName, paymentMethod } = req.body;
    const updated = await this.salesService.updateSale(
      req.params.id as string,
      {
        customerName,
        paymentMethod,
      },
    );
    res.status(200).json({ success: true, data: updated });
  });

  // DELETE /sales/:id
  deleteSale = asyncHandler(async (req: Request, res: Response) => {
    const performedBy = req.user?.userId;
    if (!performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }
    await this.salesService.deleteSale(req.params.id as string, performedBy);
    res
      .status(200)
      .json({ success: true, message: "Sale deleted and stock restored" });
  });
}
