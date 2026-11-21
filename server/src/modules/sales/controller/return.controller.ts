// return.controller.ts
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/error.ts";
import type { ReturnService } from "../services/return.service.ts";
import type { ReturnStatus } from "../types/return.type.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  // POST /returns
  // body: { salesId, returnReason, returnedBy, returnDate, items: [{saleItemId, quantity, condition, remarks?}] }
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

  // GET /returns?status=PENDING
  getAllReturns = asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as ReturnStatus | undefined;
    const returns = await this.returnService.getAllReturns(status);
    res.status(200).json({ success: true, data: returns });
  });

  // PATCH /returns/:id — reason/notes only, and only while PENDING
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

  // PATCH /returns/:id/approve
  approveReturn = asyncHandler(async (req: Request, res: Response) => {
    const approved = await this.returnService.approveReturn(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: approved });
  });

  // PATCH /returns/:id/reject
  rejectReturn = asyncHandler(async (req: Request, res: Response) => {
    const rejected = await this.returnService.rejectReturn(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: rejected });
  });

  // PATCH /returns/:id/cancel
  cancelReturn = asyncHandler(async (req: Request, res: Response) => {
    const cancelled = await this.returnService.cancelReturn(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: cancelled });
  });

  // PATCH /returns/:id/complete — applies stock and refund
  completeReturn = asyncHandler(async (req: Request, res: Response) => {
    const performedBy = req.user?.userId;
    if (!performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }

    const completed = await this.returnService.completeReturn(
      req.params.id as string,
      performedBy,
    );
    res.status(200).json({ success: true, data: completed });
  });
}
