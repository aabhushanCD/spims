// batch.controller.ts
import type { NextFunction, Request, Response } from "express";
import type { BatchService } from "../service/batch.service.ts";
import { AppError } from "../../../shared/error.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  // POST /batches
  // body: { purchaseOrderId, medicineId, batchNumber, expiryDate, manufacturingDate,
  //         purchasePrice, sellingPrice, quantityReceived, quantityRemaining }
  createBatch = asyncHandler(async (req: Request, res: Response) => {
    const batch = await this.batchService.createBatch(req.body);
    res.status(201).json({ success: true, data: batch });
  });

  // GET /batches/:id
  getBatchById = asyncHandler(async (req: Request, res: Response) => {
    const batch = await this.batchService.getBatchById(req.params.id as string);
    res.status(200).json({ success: true, data: batch });
  });

  // GET /batches
  getAllBatches = asyncHandler(async (_req: Request, res: Response) => {
    const batches = await this.batchService.getAllBatches();
    res.status(200).json({ success: true, data: batches });
  });

  // GET /batches/medicine/:medicineId/available
  getAvailableBatches = asyncHandler(async (req: Request, res: Response) => {
    const batches = await this.batchService.getAvailableBatches(
      req.params.medicineId as string,
    );
    res.status(200).json({ success: true, data: batches });
  });

  // PATCH /batches/:id
  updateBatch = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.batchService.updateBatch(
      req.params.id as string,
      req.body,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // DELETE /batches/:id
  deleteBatch = asyncHandler(async (req: Request, res: Response) => {
    const deleted = await this.batchService.deleteBatch(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: deleted });
  });

  // POST /batches/:id/deduct
  // body: { quantity }
  deductQuantity = asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    const updated = await this.batchService.deductQuantity(
      req.params.id as string,
      quantity,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // POST /batches/:id/increase
  // body: { quantity }
  increaseQuantity = asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    const updated = await this.batchService.increaseQuantity(
      req.params.id as string,
      quantity,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // POST /batches/:id/adjust
  // body: { quantity } — sets quantityRemaining directly to this value
  adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const { quantity } = req.body;
    if (typeof quantity !== "number" || quantity < 0) {
      throw AppError.badRequest("quantity must be a non-negative number");
    }
    const updated = await this.batchService.adjustStock(
      req.params.id as string,
      quantity,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // POST /batches/mark-expired
  markExpiredBatches = asyncHandler(async (_req: Request, res: Response) => {
    await this.batchService.markExpiredBatches();
    res.status(200).json({ success: true, message: "Expired batches marked" });
  });

  // GET /batches/expired
  getExpiredBatches = asyncHandler(async (_req: Request, res: Response) => {
    const batches = await this.batchService.getExpiredBatches();
    res.status(200).json({ success: true, data: batches });
  });

  // GET /batches/low-stock?threshold=10
  getLowStockBatches = asyncHandler(async (req: Request, res: Response) => {
    const threshold = Number(req.query.threshold);
    if (Number.isNaN(threshold) || threshold < 0) {
      throw AppError.badRequest(
        "threshold query param must be a non-negative number",
      );
    }
    const batches = await this.batchService.getLowStockBatches(threshold);
    res.status(200).json({ success: true, data: batches });
  });

  // GET /batches/medicine/:medicineId/allocate?quantity=5
  // NOTE: currently identical to getAvailableBatches — see flagged issue above
  allocateStock = asyncHandler(async (req: Request, res: Response) => {
    const requestedQuantity = Number(req.query.quantity);
    if (Number.isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw AppError.badRequest(
        "quantity query param must be a positive number",
      );
    }
    const batches = await this.batchService.allocateStock(
      req.params.medicineId as string,
      requestedQuantity,
    );
    res.status(200).json({ success: true, data: batches });
  });

  // GET /batches/:id/history
  getBatchHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await this.batchService.getBatchHistory(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: history });
  });
}
