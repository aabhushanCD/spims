import type { NextFunction, Request, Response } from "express";

import { AppError } from "../../../shared/error.ts";
import type { CreatePaymentDto } from "../schema/payment.schema.ts";
import type { PaymentService } from "../service/payment.service.ts";

export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  async getForSale(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.paymentService.getForSale(
        req.params.id as string,
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.userId) {
        throw AppError.unauthorized("Authenticated user required");
      }
      const payment = await this.paymentService.addPayment(
        req.params.id as string,
        req.body as CreatePaymentDto,
        req.user.userId,
      );
      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}
