import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error.ts";
import type { InventoryService } from "../services/inventory.service.ts";
import type { InventoryListQuery } from "../schema/inventory.schema.ts";
import type { InventoryMovementService } from "../services/inventoryMovement.service.ts";
import type { InventoryMovementListQuery } from "../schema/inventoryMovement.schema.ts";

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly inventoryMovementService?: InventoryMovementService,
  ) {}

  private requireMovementService(): InventoryMovementService {
    if (!this.inventoryMovementService) {
      throw AppError.notFound("Inventory movements are unavailable");
    }
    return this.inventoryMovementService;
  }

  getMovements = asyncHandler(async (req: Request, res: Response) => {
    const page = await this.requireMovementService().getMovementsPage(
      req.query as unknown as InventoryMovementListQuery,
    );
    res.status(200).json({ success: true, data: page });
  });

  getMovementById = asyncHandler(async (req: Request, res: Response) => {
    const movement = await this.requireMovementService().getMovementById(
      req.params.id as string,
    );
    res.status(200).json({ success: true, data: movement });
  });

  // POST /inventory
  createInventory = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId, reservedStock }: {
      medicineId: string;
      reservedStock?: number;
    } = req.body;
    const performedBy = req.user?.userId;
    const {
      batchId,
      referenceId,
      referenceType,
      remarks,
      movementType,
    } = req.body;

    let movementCtx;
    if (referenceId && referenceType) {
      if (!performedBy) {
        throw AppError.unauthorized("Authenticated user required");
      }
      movementCtx = {
        batchId,
        referenceId,
        referenceType,
        performedBy,
        remarks,
        movementType: movementType ?? "ADJUSTMENT",
      };
    }

    const inventory = await this.inventoryService.createInventory(
      { medicineId, reservedStock },
      movementCtx,
    );

    res.status(201).json({ success: true, data: inventory });
  });

  searchMedicines = asyncHandler(async (req: Request, res: Response) => {
    const { query } = req.query as { query: string };
    const medicines = await this.inventoryService.searchMedicines(query);
    res.status(200).json({ success: true, data: medicines });
  });

  // GET /inventory
  getAllInventories = asyncHandler(async (req: Request, res: Response) => {
    const page = await this.inventoryService.getInventoriesPage(
      req.query as unknown as InventoryListQuery,
    );
    res.status(200).json({ success: true, data: page });
  });

  // GET /inventory/:id
  getInventoryById = asyncHandler(async (req: Request, res: Response) => {
    const inventory = await this.inventoryService.getInventoryById(
      req.params.id as string,
    );
    if (!inventory) {
      throw AppError.notFound("Inventory not found");
    }
    res.status(200).json({ success: true, data: inventory });
  });

  // GET /inventory/medicine/:medicineId
  getInventoryByMedicineId = asyncHandler(
    async (req: Request, res: Response) => {
      const inventory = await this.inventoryService.getInventoryByMedicineId(
        req.params.medicineId as string,
      );
      if (!inventory) {
        throw AppError.notFound("Inventory not found for this medicine");
      }
      res.status(200).json({ success: true, data: inventory });
    },
  );

  // POST /inventory/:medicineId/increase
  // body: { quantity, batchId, referenceId, referenceType, movementType, remarks? }
  increaseStock = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId } = req.params as { medicineId: string };
    const {
      quantity,
      batchId,
      referenceId,
      referenceType,
      movementType,
      remarks,
    } = req.body;
    const performedBy = req.user?.userId;

    if (!performedBy)
      throw AppError.unauthorized("Authenticated user required");
    if (!batchId) throw AppError.badRequest("batchId is required");
    if (!referenceId || !referenceType) {
      throw AppError.badRequest("referenceId and referenceType are required");
    }
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    if (!["PURCHASE", "RETURN"].includes(movementType)) {
      throw AppError.badRequest(
        "movementType must be PURCHASE or RETURN for a stock increase",
      );
    }

    const inventory = await this.inventoryService.increaseStock(
      medicineId,
      quantity,
      {
        batchId,
        referenceId,
        referenceType,
        performedBy,
        remarks,
        movementType,
      },
    );

    res.status(200).json({ success: true, data: inventory });
  });

  // POST /inventory/:medicineId/decrease
  // body: { quantity, batchId, referenceId, referenceType, movementType, remarks? }
  decreaseStock = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId } = req.params as { medicineId: string };
    const {
      quantity,
      batchId,
      referenceId,
      referenceType,
      movementType,
      remarks,
    } = req.body;
    const performedBy = req.user?.userId;

    if (!performedBy)
      throw AppError.unauthorized("Authenticated user required");
    if (!batchId) throw AppError.badRequest("batchId is required");
    if (!referenceId || !referenceType) {
      throw AppError.badRequest("referenceId and referenceType are required");
    }
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    if (!["SALE", "EXPIRED", "ADJUSTMENT"].includes(movementType)) {
      throw AppError.badRequest(
        "movementType must be SALE, EXPIRED, or ADJUSTMENT for a stock decrease",
      );
    }

    const inventory = await this.inventoryService.decreaseStock(
      medicineId,
      quantity,
      {
        batchId,
        referenceId,
        referenceType,
        performedBy,
        remarks,
        movementType,
      },
    );

    res.status(200).json({ success: true, data: inventory });
  });

  // POST /inventory/:medicineId/reserve
  // body: { quantity, batchId?, referenceId, referenceType, remarks? }
  reserveStock = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId } = req.params as { medicineId: string };
    const { quantity, batchId, referenceId, referenceType, remarks } = req.body;
    const performedBy = req.user?.userId;
    if (!performedBy)
      throw AppError.unauthorized("Authenticated user required");
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    if (!referenceId || !referenceType) {
      throw AppError.badRequest("referenceId and referenceType are required");
    }

    const inventory = await this.inventoryService.reserveStock(
      medicineId as string,
      quantity,
      {
        batchId,
        referenceId,
        referenceType,
        performedBy,
        remarks,
        movementType: "RESERVE",
      },
    );

    res.status(200).json({ success: true, data: inventory });
  });

  // POST /inventory/:medicineId/release
  // body: { quantity, batchId?, referenceId, referenceType, remarks? }
  releaseReservedStock = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId } = req.params as { medicineId: string };
    const { quantity, batchId, referenceId, referenceType, remarks } = req.body;
    const performedBy = req.user?.userId;
    if (!performedBy)
      throw AppError.unauthorized("Authenticated user required");
    if (typeof quantity !== "number" || quantity <= 0) {
      throw AppError.badRequest("quantity must be a positive number");
    }
    if (!referenceId || !referenceType) {
      throw AppError.badRequest("referenceId and referenceType are required");
    }

    const inventory = await this.inventoryService.releaseReservedStock(
      medicineId as string,
      quantity,
      {
        batchId,
        referenceId,
        referenceType,
        performedBy,
        remarks,
        movementType: "RELEASE",
      },
    );

    res.status(200).json({ success: true, data: inventory });
  });

  // POST /inventory/:medicineId/sync
  syncInventoryFromBatch = asyncHandler(async (req: Request, res: Response) => {
    const { medicineId } = req.params as { medicineId: string };
    const performedBy = req.user?.userId;
    if (!performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }
    const inventory = await this.inventoryService.syncInventoryFromBatch(
      medicineId,
      {
        referenceId: medicineId,
        referenceType: "ADJUSTMENT",
        movementType: "ADJUSTMENT",
        performedBy,
        remarks: req.body?.remarks ?? "Aggregate reconciled from batches",
      },
    );
    res.status(200).json({ success: true, data: inventory });
  });

  // PATCH /inventory/:id
  updateInventory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const {
      batchId,
      referenceId,
      referenceType,
      remarks,
      movementType,
      ...updateData
    } = req.body;
    const performedBy = req.user?.userId;

    if (referenceId && referenceType && !performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }
    const movementCtx =
      referenceId && referenceType
        ? {
            batchId,
            referenceId,
            referenceType,
            performedBy: performedBy!,
            remarks,
            movementType,
          }
        : undefined;

    const updated = await this.inventoryService.updateInventory(
      id,
      updateData,
      movementCtx,
    );
    if (!updated) throw AppError.notFound("Inventory not found");

    res.status(200).json({ success: true, data: updated });
  });

  // DELETE /inventory/:id
  deleteInventory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { batchId, referenceId, referenceType, remarks } = req.body ?? {};
    const performedBy = req.user?.userId;

    if (referenceId && referenceType && !performedBy) {
      throw AppError.unauthorized("Authenticated user required");
    }
    const movementCtx =
      referenceId && referenceType
        ? {
            batchId,
            referenceId,
            referenceType,
            performedBy: performedBy!,
            remarks,
            movementType: "ADJUSTMENT" as const,
          }
        : undefined;

    const deleted = await this.inventoryService.deleteInventory(
      id as string,
      movementCtx,
    );
    if (!deleted) throw AppError.notFound("Inventory not found");

    res
      .status(200)
      .json({ success: true, message: "Inventory deleted successfully" });
  });
}
