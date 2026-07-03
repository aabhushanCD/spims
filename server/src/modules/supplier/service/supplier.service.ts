import mongoose from "mongoose";
import type { AppError } from "../../../shared/error.js";
import type { SupplierRepo } from "../repo/supplier.repo.js";
import type { UpdateSupplierDto } from "../schema/supplier.schema.js";

export class SupplierService {
  constructor(
    private readonly supplierRepo: SupplierRepo,
    private readonly appError: typeof AppError,
  ) {}

  async createSupplier(supplierData: any) {
    if (supplierData.email) {
      const existingEmail = await this.supplierRepo.findByEmail(
        supplierData.email,
      );

      if (existingEmail) {
        throw this.appError.conflict("Supplier with this email already exists");
      }
    }
    if (supplierData.phone) {
      const existingPhone = await this.supplierRepo.findByPhone(
        supplierData.phone,
      );
      if (existingPhone) {
        throw this.appError.conflict(
          "Supplier with this phone number already exists",
        );
      }
    }
    return this.supplierRepo.create(supplierData);
  }

  async getSupplierById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.appError.badRequest("Invalid supplier id");
    }

    const supplier = await this.supplierRepo.findById(id);

    if (!supplier) {
      throw this.appError.notFound("Supplier not found");
    }
    return supplier;
  }

  async getAllSuppliers() {
    return this.supplierRepo.findAll();
  }

  async updateSupplier(id: string, supplierData: UpdateSupplierDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.appError.badRequest("Invalid supplier id");
    }
    const existingSupplier = await this.supplierRepo.findById(id);
    if (!existingSupplier) {
      throw this.appError.notFound("Supplier not found");
    }
    if (supplierData.email && supplierData.email !== existingSupplier.email) {
      const existingEmail = await this.supplierRepo.findByEmail(
        supplierData.email,
      );
      if (existingEmail && existingEmail._id.toString() !== id) {
        throw this.appError.conflict("Supplier with this email already exists");
      }
    }
    if (supplierData.phone && supplierData.phone !== existingSupplier.phone) {
      const existingPhone = await this.supplierRepo.findByPhone(
        supplierData.phone,
      );
      if (existingPhone && existingPhone._id.toString() !== id) {
        throw this.appError.conflict(
          "Supplier with this phone number already exists",
        );
      }
    }

    const updatedSupplier = await this.supplierRepo.update(id, supplierData);
    if (!updatedSupplier) {
      throw this.appError.notFound("Supplier not found");
    }
    return updatedSupplier;
  }

  async deleteSupplier(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw this.appError.badRequest("Invalid supplier id");
    }
    const existingSupplier = await this.supplierRepo.findById(id);
    if (!existingSupplier) {
      throw this.appError.notFound("Supplier not found");
    }

    return this.supplierRepo.delete(id);
  }
}
