// sales.controller.ts
import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../../shared/error.ts";
import type { SalesService } from "../services/sales.service.ts";
import type {
  CreateSaleDto,
  SalesListQuery,
} from "../schema/sales.schema.ts";

export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // POST /sales
  // body: { invoiceNumber, customerName, paymentMethod,
  //  saleDate, items: [{medicineId, batchId, quantity,
  // unitPrice, discount?}], overallDiscount? }
  async createSale(req: Request, res: Response, next: NextFunction) {
    try {
      const cashierId = req.user?.userId;
      if (!cashierId) {
        throw AppError.unauthorized("Authenticated user required");
      }

      const { customerId, customerName, paymentMethod, saleDate, items } =
        req.body as CreateSaleDto;

      if (!Array.isArray(items) || items.length === 0) {
        throw AppError.badRequest("Sale must include at least one item");
      }

      const headerKey = req.headers["idempotency-key"];
      const idempotencyKey =
        typeof headerKey === "string" ? headerKey : req.body.idempotencyKey;
      if (
        idempotencyKey !== undefined &&
        (typeof idempotencyKey !== "string" ||
          idempotencyKey.length < 8 ||
          idempotencyKey.length > 200)
      ) {
        throw AppError.badRequest(
          "Idempotency-Key must be between 8 and 200 characters",
        );
      }

      const sale = await this.salesService.createSale({
        ...(customerId ? { customerId } : {}),
        ...(customerName ? { customerName } : {}),
        paymentMethod,
        saleDate,
        cashierId: req.user!.userId,
        discount: req.body.discount,
        ...(idempotencyKey ? { idempotencyKey } : {}),
        items,
      });

      res.status(201).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }
  // GET /sales/:id
  async getSaleById(req: Request, res: Response, next: NextFunction) {
    try {
      const sale = await this.salesService.getSaleById(req.params.id as string);
      res.status(200).json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  // GET /sales/:id/invoice
  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await this.salesService.getInvoice(
        req.params.id as string,
      );
      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  // GET /sales
  async getAllSales(req: Request, res: Response, next: NextFunction) {
    try {
      const page = await this.salesService.getSalesPage(
        req.query as unknown as SalesListQuery,
      );
      res.status(200).json({ success: true, data: page });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /sales/:id
  // body: { customerName?, paymentMethod? } — financial/quantity fields are NOT editable here
  async updateSale(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, customerName, paymentMethod } = req.body;
      const updated = await this.salesService.updateSale(
        req.params.id as string,
        {
          ...(customerId !== undefined ? { customerId } : {}),
          ...(customerName !== undefined ? { customerName } : {}),
          ...(paymentMethod !== undefined ? { paymentMethod } : {}),
        },
      );
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /sales/:id
  async deleteSale(req: Request, res: Response, next: NextFunction) {
    try {
      const performedBy = req.user?.userId;
      if (!performedBy) {
        throw AppError.unauthorized("Authenticated user required");
      }
      await this.salesService.deleteSale(req.params.id as string, performedBy);
      res
        .status(200)
        .json({ success: true, message: "Sale deleted and stock restored" });
    } catch (error) {
      next(error);
    }
  }
}
