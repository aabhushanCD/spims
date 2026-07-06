// return.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/error.ts";
import type { ReturnService } from "../services/return.service.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  // POST /returns
  // body: { salesId, returnReason, returnedBy, returnDate, items: [{saleItemId, quantity}] }
  createReturn = asyncHandler(async (req: Request, res: Response) => {
    const performedBy = req.user?.userId;
    if (!performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }

    const { salesId, returnReason, returnedBy, returnDate, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      throw AppError.badRequest("Return must include at least one item");
    }

    const salesReturn = await this.returnService.createReturn({
      salesId,
      returnReason,
      returnedBy,
      returnDate,
      items,
      performedBy,
    });

    res.status(201).json({ success: true, data: salesReturn });
  });

  // GET /returns/:id
  getReturnById = asyncHandler(async (req: Request, res: Response) => {
    const salesReturn = await this.returnService.getReturnById(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: salesReturn });
  });

  // GET /returns
  getAllReturns = asyncHandler(async (_req: Request, res: Response) => {
    const returns = await this.returnService.getAllReturns();
    res.status(200).json({ success: true, data: returns });
  });

  // PATCH /returns/:id — reason/notes only, not items (no restock reversal supported)
  updateReturn = asyncHandler(async (req: Request, res: Response) => {
    const { returnReason } = req.body;
    if (!returnReason) {
      throw AppError.badRequest("Nothing to update");
    }
    const updated = await this.returnService.updateReturn(
      req.params.id as string,
      {
        returnReason,
      },
    );
    res.status(200).json({ success: true, data: updated });
  });
}
