import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppError } from "../../../shared/error.ts";
import type { PurchaseOrderRepo } from "../../purchase/repo/purchaseOrder.repo.ts";
import type { SupplierRepo } from "../repo/supplier.repo.ts";
import { SupplierService } from "./supplier.service.ts";

const SUPPLIER_ID = "507f1f77bcf86cd799439011";

describe("SupplierService", () => {
  const supplierRepo = {
    findById: vi.fn(),
    delete: vi.fn(),
  };
  const purchaseOrderRepo = {
    countOpenBySupplier: vi.fn(),
  };

  const createService = () =>
    new SupplierService(
      supplierRepo as unknown as SupplierRepo,
      purchaseOrderRepo as unknown as PurchaseOrderRepo,
      AppError,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    supplierRepo.findById.mockResolvedValue({ _id: SUPPLIER_ID });
  });

  it("blocks deletion while open purchase orders exist", async () => {
    purchaseOrderRepo.countOpenBySupplier.mockResolvedValue(2);

    await expect(
      createService().deleteSupplier(SUPPLIER_ID),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Cannot delete a supplier with open purchase orders",
    });

    expect(supplierRepo.delete).not.toHaveBeenCalled();
  });

  it("deletes a supplier with no open purchase orders", async () => {
    purchaseOrderRepo.countOpenBySupplier.mockResolvedValue(0);
    supplierRepo.delete.mockResolvedValue({ _id: SUPPLIER_ID });

    await expect(
      createService().deleteSupplier(SUPPLIER_ID),
    ).resolves.toMatchObject({ _id: SUPPLIER_ID });

    expect(supplierRepo.delete).toHaveBeenCalledWith(SUPPLIER_ID);
  });

  it("rejects a malformed supplier id before querying", async () => {
    await expect(createService().deleteSupplier("bad")).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
