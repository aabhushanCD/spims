import type { NextFunction, Request, Response } from "express";

import type { CustomerListQuery } from "../schema/customer.schema.ts";
import type { CustomerService } from "../service/customer.service.ts";

export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.create(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await this.customerService.getPage(
        req.query as unknown as CustomerListQuery,
      );
      res.status(200).json({
        success: true,
        data: { items: page.items, nextCursor: page.nextCursor },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.getById(
        req.params.id as string,
      );
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await this.customerService.update(
        req.params.id as string,
        req.body,
      );
      res.status(200).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await this.customerService.delete(req.params.id as string);
      res.status(200).json({ success: true, message: "Customer deleted" });
    } catch (error) {
      next(error);
    }
  }
}
