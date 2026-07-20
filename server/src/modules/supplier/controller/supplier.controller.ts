import type { NextFunction, Request, Response } from "express";
import type { SupplierService } from "../service/supplier.service.js";
import type {
  CreateSupplierDto,
  UpdateSupplierDto,
} from "../schema/supplier.schema.js";

export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const supplierData = req.body as CreateSupplierDto;
      const newSupplier =
        await this.supplierService.createSupplier(supplierData);
      return res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        data: newSupplier,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getSupplierById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const supplier = await this.supplierService.getSupplierById(id);
      return res.status(200).json({
        success: true,
        message: "Supplier retrieved successfully",
        data: supplier,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async getAllSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const suppliers = await this.supplierService.getAllSuppliers();
      return res.status(200).json({
        success: true,
        message: "Suppliers retrieved successfully",
        data: suppliers,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const supplierData = req.body as UpdateSupplierDto;
      const updatedSupplier = await this.supplierService.updateSupplier(
        id,
        supplierData,
      );
      return res.status(200).json({
        success: true,
        message: "Supplier updated successfully",
        data: updatedSupplier,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as { id: string };
      const deletedSupplier = await this.supplierService.deleteSupplier(id);
      return res.status(200).json({
        success: true,
        message: "Supplier deleted successfully",
        data: deletedSupplier,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
