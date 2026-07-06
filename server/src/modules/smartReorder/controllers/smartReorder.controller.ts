// smartReorder.controller.ts
import type { NextFunction, Request, Response } from "express";

import type { SmartReorderService } from "../services/smartReorder.service.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class SmartReorderController {
  constructor(private readonly smartReorderService: SmartReorderService) {}

  // GET /smart-reorders
  getAll = asyncHandler(async (_req: Request, res: Response) => {
    const reorders = await this.smartReorderService.getAll();
    res.status(200).json({ success: true, data: reorders });
  });

  // GET /smart-reorders/pending
  getPending = asyncHandler(async (_req: Request, res: Response) => {
    const reorders = await this.smartReorderService.getPending();
    res.status(200).json({ success: true, data: reorders });
  });

  // GET /smart-reorders/medicine/:medicineId
  getByMedicineId = asyncHandler(async (req: Request, res: Response) => {
    const reorders = await this.smartReorderService.getByMedicineId(
      req.params.medicineId as string,
    );
    res.status(200).json({ success: true, data: reorders });
  });

  // GET /smart-reorders/:id
  getById = asyncHandler(async (req: Request, res: Response) => {
    const reorder = await this.smartReorderService.getById(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: reorder });
  });

  // PATCH /smart-reorders/:id/approve
  approve = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.smartReorderService.approve(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // PATCH /smart-reorders/:id/reject
  reject = asyncHandler(async (req: Request, res: Response) => {
    const updated = await this.smartReorderService.reject(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: updated });
  });

  // DELETE /smart-reorders/:id — admin only
  delete = asyncHandler(async (req: Request, res: Response) => {
    await this.smartReorderService.delete(req.params.id as string);
    res.status(200).json({ success: true, message: "Recommendation deleted" });
  });

  // POST /smart-reorders/generate — admin/manager only, manual on-demand trigger
  // body (optional): { threshold?, targetStock? }
  generateAll = asyncHandler(async (req: Request, res: Response) => {
    const { threshold, targetStock } = req.body ?? {};
    const results = await this.smartReorderService.generateForAllMedicines(
      threshold,
      targetStock,
    );
    res.status(200).json({ success: true, data: results });
  });

  // POST /smart-reorders/generate/:medicineId — admin/manager only, single medicine
  generateForMedicine = asyncHandler(async (req: Request, res: Response) => {
    const { threshold, targetStock } = req.body ?? {};
    const reorder =
      await this.smartReorderService.generateRecommendationForMedicine(
        req.params.medicineId as string,
        threshold,
        targetStock,
      );
    res.status(201).json({ success: true, data: reorder });
  });
}
