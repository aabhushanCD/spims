import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../../shared/error.ts";
import type { CreatePurchaseReturnDto, PurchaseReturnListQuery } from "../schema/purchaseReturn.schema.ts";
import type { PurchaseReturnService } from "../service/purchaseReturn.service.ts";

export class PurchaseReturnController {
  constructor(private readonly service: PurchaseReturnService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = req.user?.userId;
      if (!performedBy) {
        throw AppError.unauthorized("Authenticated user required");
      }
      const doc = await this.service.create(
        req.body as CreatePurchaseReturnDto,
        performedBy,
      );
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await this.service.getPage(
        req.query as unknown as PurchaseReturnListQuery,
      );
      res.status(200).json({ success: true, data: page });
    } catch (error) {
      next(error);
    }
  }

  async getSupplierLedger(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.service.getSupplierLedger(
        req.params.supplierId as string,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.getById(req.params.id as string);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.approve(req.params.id as string);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.reject(req.params.id as string);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.cancel(req.params.id as string);
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = req.user?.userId;
      if (!performedBy) {
        throw AppError.unauthorized("Authenticated user required");
      }
      const doc = await this.service.complete(
        req.params.id as string,
        performedBy,
      );
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }
}
