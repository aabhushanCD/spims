import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../../shared/error.ts";
import type {
  CreateStocktakeDto,
  StocktakeListQuery,
  UpdateStocktakeDto,
} from "../schema/stocktake.schema.ts";
import type { StocktakeService } from "../service/stocktake.service.ts";

export class StocktakeController {
  constructor(private readonly service: StocktakeService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw AppError.unauthorized("Authenticated user required");
      }
      const doc = await this.service.create(
        req.body as CreateStocktakeDto,
        req.user.userId,
      );
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await this.service.getPage(
        req.query as unknown as StocktakeListQuery,
      );
      res.status(200).json({ success: true, data: page });
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

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await this.service.update(
        req.params.id as string,
        req.body as UpdateStocktakeDto,
      );
      res.status(200).json({ success: true, data: doc });
    } catch (error) {
      next(error);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw AppError.unauthorized("Authenticated user required");
      }
      const doc = await this.service.complete(
        req.params.id as string,
        req.user.userId,
      );
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
}
