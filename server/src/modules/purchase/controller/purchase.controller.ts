import type { NextFunction, Request, Response } from "express";
import type { PurchaseOrderService } from "../services/purchaseOrder.service.ts";

export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseOrderService) {}

  async createPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    console.log("Request body:", req.body);
    try {
      const purchaseOrder = await this.purchaseService.createPurchaseOrder(
        req.body,
      );
      return res.status(201).json({
        message: "Purchase order created successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPurchaseOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrders = await this.purchaseService.getPurchaseOrders();
      return res.status(200).json({
        message: "Purchase orders retrieved successfully",
        data: purchaseOrders,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPurchaseOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await this.purchaseService.getPurchaseOrderById(
        req.params.id as string,
      );
      return res.status(200).json({
        message: "Purchase order retrieved successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deletePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      await this.purchaseService.deletePurchaseOrder(req.params.id as string);
      return res.status(200).json({
        message: "Purchase order deleted successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async cancelPurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      await this.purchaseService.cancelPurchaseOrder(req.params.id as string);
      return res.status(200).json({
        message: "Purchase order canceled successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async approvePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      await this.purchaseService.approvePurchaseOrder(req.params.id as string);
      return res.status(200).json({
        message: "Purchase order approved successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async receivePurchaseOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await this.purchaseService.receivePurchaseOrder(
        req.params.id as string,
        req.body,
        req.user?.userId as string,
      );
      return res.status(200).json({
        message: "Purchase order received successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async addPurchaseOrderItem(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrderItem = await this.purchaseService.addPurchaseOrderItem(
        req.params.id as string,
        req.body,
      );
      return res.status(201).json({
        message: "Purchase order item added successfully",
        data: purchaseOrderItem,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updatePurchaseOrderItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const purchaseOrderItem =
        await this.purchaseService.updatePurchaseOrderItem(
          req.params.id as string,
          req.params.itemId as string,
          req.body,
        );
      return res.status(200).json({
        message: "Purchase order item updated successfully",
        data: purchaseOrderItem,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async removePurchaseOrderItem(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.purchaseService.removePurchaseOrderItem(
        req.params.id as string,
        req.params.itemId as string,
      );
      return res.status(200).json({
        message: "Purchase order item removed successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async recalculateTotals(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await this.purchaseService.recalculateTotals(
        req.params.id as string,
      );
      return res.status(200).json({
        message: "Purchase order totals recalculated successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPurchaseOrdersBySupplierId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const purchaseOrders =
        await this.purchaseService.getPurchaseOrdersBySupplierId(
          req.params.supplierId as string,
        );
      return res.status(200).json({
        message: "Purchase orders retrieved successfully",
        data: purchaseOrders,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getPurchaseOrderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const purchaseOrder = await this.purchaseService.getAllPurchaseOrderItems(
        req.params.id as string,
      );
      return res.status(200).json({
        message: "Purchase order items retrieved successfully",
        data: purchaseOrder,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
